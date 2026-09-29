const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { io: ioClient } = require('socket.io-client');
const { startServer } = require('../src/server');
const FileMessageRepository = require('../src/repositories/fileMessageRepository');

let server;
let baseUrl;
let tmpDir;
const sockets = [];

const connect = (username) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { auth: { username }, transports: ['websocket'], forceNew: true });
    sockets.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });

const waitFor = (socket, event, predicate = () => true, timeoutMs = 2000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-test-'));
  const repository = new FileMessageRepository(path.join(tmpDir, 'messages.json'), { flushDelayMs: 0 });
  server = await startServer({ port: 0, repository });
  baseUrl = `http://localhost:${server.port}`;
});

after(async () => {
  sockets.forEach((s) => s.disconnect());
  await server.stop();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('health check responds', async () => {
  const res = await request(baseUrl).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('login validates the username', async () => {
  const ok = await request(baseUrl).post('/api/auth/login').send({ username: 'alice' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.username, 'alice');

  const bad = await request(baseUrl).post('/api/auth/login').send({ username: 'a b!' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'BAD_REQUEST');
});

test('POST /api/messages rejects invalid input and malformed JSON', async () => {
  const empty = await request(baseUrl).post('/api/messages').send({ username: 'alice', text: '   ' });
  assert.equal(empty.status, 400);

  const malformed = await request(baseUrl)
    .post('/api/messages')
    .set('Content-Type', 'application/json')
    .send('{"bad json');
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.code, 'INVALID_JSON');
});

test('REST send is stored, idempotent, returned in history and broadcast over sockets', async () => {
  const listener = await connect('watcher');
  const received = waitFor(listener, 'message:new', (m) => m.text === 'hello via rest');

  const res = await request(baseUrl)
    .post('/api/messages')
    .send({ username: 'alice', text: 'hello via rest', clientId: 'c-1' });
  assert.equal(res.status, 201);
  assert.ok(res.body.message.id);
  assert.ok(res.body.message.createdAt);

  const broadcast = await received;
  assert.equal(broadcast.id, res.body.message.id);

  const retry = await request(baseUrl)
    .post('/api/messages')
    .send({ username: 'alice', text: 'hello via rest', clientId: 'c-1' });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.message.id, res.body.message.id);

  const history = await request(baseUrl).get('/api/messages');
  assert.equal(history.status, 200);
  assert.equal(history.body.messages.filter((m) => m.clientId === 'c-1').length, 1);
});

test('history paginates with limit and before', async () => {
  for (let i = 0; i < 3; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await request(baseUrl).post('/api/messages').send({ username: 'pager', text: `page ${i}` });
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 5));
  }
  const first = await request(baseUrl).get('/api/messages?limit=2');
  assert.equal(first.body.messages.length, 2);
  assert.equal(first.body.hasMore, true);
  assert.equal(first.body.messages[1].text, 'page 2');

  const older = await request(baseUrl).get(`/api/messages?limit=2&before=${first.body.messages[0].createdAt}`);
  assert.ok(older.body.messages.every((m) => m.createdAt < first.body.messages[0].createdAt));

  const invalid = await request(baseUrl).get('/api/messages?limit=abc');
  assert.equal(invalid.status, 400);
});

test('socket messaging, typing, receipts and presence', async () => {
  const bob = await connect('bob');
  const carol = await connect('carol');

  // Typing indicator
  const typing = waitFor(carol, 'typing:update', (names) => names.includes('bob'));
  bob.emit('typing:start');
  await typing;

  // Send with acknowledgement; typing stops automatically
  const incoming = waitFor(carol, 'message:new', (m) => m.text === 'hi carol');
  const typingCleared = waitFor(carol, 'typing:update', (names) => !names.includes('bob'));
  const ack = await bob.timeout(2000).emitWithAck('message:send', { text: 'hi carol', clientId: 'b-1' });
  assert.equal(ack.ok, true);
  const message = await incoming;
  await typingCleared;

  // Read receipt reaches the sender
  const status = waitFor(bob, 'message:status', (updates) =>
    updates.some((u) => u.id === message.id && u.readBy.includes('carol')),
  );
  await carol.timeout(2000).emitWithAck('message:read', { ids: [message.id] });
  const [update] = (await status).filter((u) => u.id === message.id);
  assert.deepEqual(update.deliveredTo, ['carol']);

  // Validation errors come back through the ack instead of crashing
  const badAck = await bob.timeout(2000).emitWithAck('message:send', { text: '' });
  assert.equal(badAck.ok, false);
  assert.match(badAck.error, /required/);

  // Presence: carol goes offline
  const offline = waitFor(bob, 'presence:update', (users) =>
    users.some((u) => u.username === 'carol' && !u.online && u.lastSeen),
  );
  carol.disconnect();
  await offline;

  const users = await request(baseUrl).get('/api/users');
  assert.ok(users.body.users.some((u) => u.username === 'bob' && u.online));
});

test('socket connection without a valid username is rejected', async () => {
  await assert.rejects(connect(''), /Username is required/);
});

test('messages persist across repository restarts', async () => {
  await server.stop();
  const repository = new FileMessageRepository(path.join(tmpDir, 'messages.json'));
  server = await startServer({ port: 0, repository });
  baseUrl = `http://localhost:${server.port}`;

  const history = await request(baseUrl).get('/api/messages?limit=100');
  assert.ok(history.body.messages.some((m) => m.text === 'hi carol'));
});
