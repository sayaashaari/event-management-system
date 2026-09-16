import assert from 'node:assert/strict';
import { validateRegistration } from './registrationRules.js';

const events = [
  { eventId: 'event-1', capacity: 3 },
  { eventId: 'event-full', capacity: 1 },
];
const participants = [
  { participantId: 'participant-1' },
  { participantId: 'participant-2' },
];
const registrations = [
  { eventId: 'event-1', participantId: 'participant-1' },
  { eventId: 'event-full', participantId: 'participant-1' },
];

assert.match(validateRegistration('', 'participant-1', events, participants, registrations), /event that exists/);
assert.match(validateRegistration('missing-event', 'participant-1', events, participants, registrations), /event that exists/);
assert.match(validateRegistration('event-1', '', events, participants, registrations), /participant that exists/);
assert.match(validateRegistration('event-1', 'missing-participant', events, participants, registrations), /participant that exists/);
assert.match(validateRegistration('event-1', 'participant-1', events, participants, registrations), /already registered/);
assert.match(validateRegistration('event-full', 'participant-2', events, participants, registrations), /capacity has been reached/);
assert.equal(validateRegistration('event-1', 'participant-2', events, participants, registrations), null);

console.log('Registration rules passed: event and participant existence, duplicate prevention, capacity, and valid registration.');
