# Realtime Chat

A real-time group chat app built with **React Native (Expo)** on the frontend and **Node.js + Express + Socket.io** on the backend. The same codebase runs on Android, iOS and the web.

## Features

**Core**
- Send messages, and receive them instantly over Socket.io (no refresh or polling)
- Chat history loads over REST, so previous messages are still there after a refresh or app restart
- Every message shows a timestamp, with date separators (Today / Yesterday / date)
- REST APIs to send messages and fetch chat history
- Graceful handling of connections, disconnections, reconnections, and API/socket errors

**Bonus**
- Username login (dummy auth, remembered across restarts)
- Typing indicator ("alice is typing…")
- Online/offline status for each user, with "last seen"
- Message status: sending 🕓 → sent ✓ → delivered ✓✓ → read ✓✓ (blue). Tap your own message to see who it was delivered to or read by.
- Persistent storage in MongoDB, or in a local JSON file when no database is configured
- Loads older messages as you scroll up (paginated history)
- Optimistic sending with retry: failed messages can be tapped to resend, and retries never create duplicates
- Deployment config for Render (`render.yaml`)

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Env-based configuration
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # 404 + centralized error handler
│   │   ├── models/          # Mongoose schema
│   │   ├── repositories/    # Storage layer: MongoDB or JSON file (same interface)
│   │   ├── routes/          # REST routes
│   │   ├── services/        # Business logic: messages, presence/typing
│   │   ├── sockets/         # Socket.io server + event names
│   │   ├── utils/           # AppError, validators, logger, asyncHandler
│   │   ├── app.js           # Express app
│   │   └── server.js        # Wires everything and starts HTTP + Socket.io
│   └── tests/               # Integration tests (REST + Socket.io)
├── frontend/
│   ├── App.js               # Providers + login/chat switch
│   └── src/
│       ├── api/             # fetch wrapper (timeouts, errors) + chat API
│       ├── components/      # MessageBubble, MessageInput, TypingIndicator, ...
│       ├── constants/       # Socket event names
│       ├── context/         # AuthContext (dummy login)
│       ├── hooks/           # useChat (all chat logic), chatReducer, useAppActive
│       ├── screens/         # LoginScreen, ChatScreen
│       ├── services/        # Socket.io client factory
│       ├── storage/         # AsyncStorage session
│       ├── utils/           # Time formatting, message merge helpers
│       ├── config.js        # API URL resolution + tunables
│       └── theme.js
└── render.yaml              # Render deployment blueprint for the backend
```

## Prerequisites

- Node.js 18 or later (developed on Node 20)
- npm
- To run on a phone: the **Expo Go** app ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), with the phone on the same Wi-Fi network as your computer
- Optional: a MongoDB connection string (for example, a free MongoDB Atlas cluster)

## Running the backend

```bash
cd backend
npm install
cp .env.example .env        # optional; the defaults work out of the box
npm run dev                 # or: npm start
```

The server starts on `http://localhost:4000`. To check it, open `http://localhost:4000/api/health`.

Run the tests:

```bash
npm test
```

### Backend environment variables

| Variable             | Required | Default               | Description                                                                 |
|----------------------|----------|-----------------------|-----------------------------------------------------------------------------|
| `PORT`               | No       | `4000`                | HTTP and Socket.io port                                                     |
| `CORS_ORIGIN`        | No       | `*`                   | Allowed origins, comma-separated, or `*`                                    |
| `MONGODB_URI`        | No       | *(empty)*             | MongoDB connection string. If it's empty, messages go to a JSON file.      |
| `DATA_FILE`          | No       | `data/messages.json`  | JSON file path, used only when `MONGODB_URI` is empty                       |
| `MESSAGE_MAX_LENGTH` | No       | `1000`                | Maximum characters per message                                              |

## Running the frontend

```bash
cd frontend
npm install
npx expo start
```

Then choose how to open it:
- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS)
- **Web:** press `w`
- **Android emulator:** press `a`

In development you don't need to configure the backend URL. The app talks to `http://<IP of the machine running Expo>:4000`, so a phone on the same Wi-Fi reaches your local backend automatically. If it can't connect, make sure the Windows/macOS firewall allows port 4000, or set the URL yourself (see below).

To try it with two users, open the app on a phone and in a browser (or in two browser tabs) and log in with different usernames.

### Frontend environment variables

| Variable              | Required                  | Description                                                                 |
|-----------------------|---------------------------|-----------------------------------------------------------------------------|
| `EXPO_PUBLIC_API_URL` | For APK/production builds | Backend base URL, e.g. `https://realtime-chat-backend.onrender.com`. It's baked into the app at build time. |

Put it in `frontend/.env` (see `frontend/.env.example`).

## Building the APK

The APK is built with EAS Build, in the cloud. You need a free Expo account.

```bash
cd frontend
# Point the app at the deployed backend (an APK can't reach localhost)
echo "EXPO_PUBLIC_API_URL=https://<your-backend-url>" > .env
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

When the build finishes, EAS prints a download link for the `.apk`. The `preview` profile in `eas.json` is set up to produce an installable APK rather than an AAB.

## Deploying the backend (Render)

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repo. Render reads `render.yaml`, which uses `rootDir: backend`.
3. Set `MONGODB_URI` in the dashboard. Render's disk is ephemeral, so without a database the JSON-file history is wiped on every redeploy or restart.
4. Use the service URL (`https://<name>.onrender.com`) as `EXPO_PUBLIC_API_URL`.

Render's free tier supports WebSockets. It sleeps after about 15 minutes idle, so the first request after that can take around 30 seconds.

## API reference

Base URL: `http://localhost:4000/api`

| Method | Endpoint        | Body / query                                   | Description                                 |
|--------|-----------------|------------------------------------------------|---------------------------------------------|
| GET    | `/health`       |                                                | Health check                                |
| POST   | `/auth/login`   | `{ "username": "alice" }`                      | Dummy login: validates and returns the user |
| GET    | `/messages`     | `?limit=50&before=<ISO date>`                  | Chat history: `{ messages, hasMore }`, oldest first |
| POST   | `/messages`     | `{ "username", "text", "clientId"? }`          | Send a message. It's stored and broadcast to all sockets. |
| GET    | `/users`        |                                                | Users with online status / last seen       |

Errors always have the shape `{ "error": { "code": "BAD_REQUEST", "message": "..." } }`, with a matching HTTP status (400, 404 or 500).

Example:

```bash
curl -X POST http://localhost:4000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","text":"Hello from curl"}'
```

### Socket.io events

The client connects with `io(URL, { auth: { username } })`. Connections without a valid username are rejected.

| Direction       | Event               | Payload                                   |
|-----------------|---------------------|-------------------------------------------|
| client → server | `message:send`      | `{ text, clientId }`, acked with `{ ok, message }` or `{ ok: false, error }` |
| client → server | `message:delivered` | `{ ids: [...] }`                          |
| client → server | `message:read`      | `{ ids: [...] }`                          |
| client → server | `typing:start` / `typing:stop` |                                |
| server → client | `message:new`       | message                                   |
| server → client | `message:status`    | `[{ id, deliveredTo, readBy }]`           |
| server → client | `presence:update`   | `[{ username, online, lastSeen }]`        |
| server → client | `typing:update`     | `[username, ...]`                         |

## Design decisions

- **Layered backend.** The layers are routes → controllers → services → repositories. `MessageService` doesn't know about HTTP or Socket.io: it validates input, saves the message, and emits events. The socket layer listens for those events and broadcasts them. That's why a message sent through the REST API still reaches every connected client in real time, and why sending logic isn't duplicated between REST and sockets.
- **Swappable storage.** `MongoMessageRepository` and `FileMessageRepository` have the same interface. Mongo is used when `MONGODB_URI` is set. Otherwise the JSON file keeps setup to zero dependencies while history still survives restarts. File writes are debounced and atomic (write to a temp file, then rename).
- **Idempotent sends.** Each message carries a client-generated `clientId`. If a send is retried after a timeout or network failure, the server returns the stored copy instead of creating a duplicate.
- **Optimistic UI with a REST fallback.** Messages appear immediately as "sending". They're sent over the socket with an acknowledgement and a timeout. If the socket is down, the app falls back to `POST /api/messages`. If both fail, the message is marked failed and can be retried.
- **Resync on reconnect.** After a reconnect, the client re-fetches the latest page and merges it by id. Messages sent while the client was offline show up without duplicates.
- **Presence handles several devices.** A user stays online while at least one of their sockets is connected, so multiple tabs or devices work correctly.
- **Typing indicator can't get stuck.** The client sends `typing:stop` after 2 seconds idle. The server also clears typing on send, on disconnect, and after 5 seconds without a refresh.
- **Receipts.** A message counts as *delivered* when another user's client receives it, and *read* when that client has it on screen with the app in the foreground (tracked with `AppState`, which follows tab visibility on the web).
- **Chat state in one hook.** `useChat` and a pure reducer hold all chat state. Components only render, which keeps them simple and reusable.
- **Inverted `FlatList`.** The list stays anchored to the newest message, and older pages load when you scroll up.
- **No navigation library.** There are only two screens, chosen by auth state, so React Navigation or Expo Router would add weight without benefit.
- **Expo Go compatible.** The app uses no custom native modules, so reviewers can run it without a development build.

## Assumptions

- There's one shared group chat room (no private or 1:1 chats).
- Authentication is intentionally a dummy: there are no passwords, anyone can use any valid username, and two devices can share a username. Usernames are 2–20 characters (letters, numbers, `_`, `.`, `-`).
- Presence and typing state are kept in memory, so a single backend instance is assumed. Scaling out would need the Socket.io Redis adapter and a shared presence store.
- Messages are plain text of up to 1000 characters. There's no editing, deleting, or media.
- In a group chat, "delivered" and "read" mean *at least one* other user, and the tap-to-view detail lists exactly who.
- Timestamps are set by the server (UTC ISO strings) and shown in the device's local time.
