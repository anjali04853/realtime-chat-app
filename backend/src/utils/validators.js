const config = require('../config');
const AppError = require('./AppError');

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

function validateUsername(raw) {
  const username = typeof raw === 'string' ? raw.trim() : '';
  const { minLength, maxLength } = config.username;

  if (!username) throw AppError.badRequest('Username is required');
  if (username.length < minLength || username.length > maxLength) {
    throw AppError.badRequest(`Username must be ${minLength}-${maxLength} characters`);
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw AppError.badRequest('Username may only contain letters, numbers, "_", "." and "-"');
  }
  return username;
}

function validateMessageText(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const { maxLength } = config.messages;

  if (!text) throw AppError.badRequest('Message text is required');
  if (text.length > maxLength) {
    throw AppError.badRequest(`Message must be at most ${maxLength} characters`);
  }
  return text;
}

function validateClientId(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string' || raw.length > 64) {
    throw AppError.badRequest('clientId must be a string of at most 64 characters');
  }
  return raw;
}

function validateIdList(raw) {
  if (!Array.isArray(raw)) throw AppError.badRequest('ids must be an array');
  return raw.filter((id) => typeof id === 'string' && id.length > 0).slice(0, 200);
}

module.exports = { validateUsername, validateMessageText, validateClientId, validateIdList };
