export function validateRegistration(eventId, participantId, events, participants, registrations) {
  const event = events.find((item) => item.eventId === eventId);
  if (!eventId || !event) return 'Select an event that exists in the event list.';

  const participant = participants.find((item) => item.participantId === participantId);
  if (!participantId || !participant) return 'Select a participant that exists in the participant list.';

  if (registrations.some((item) => item.eventId === event.eventId && item.participantId === participant.participantId)) {
    return 'This participant is already registered for this event.';
  }

  const registrationCount = registrations.filter((item) => item.eventId === event.eventId).length;
  if (registrationCount >= Number(event.capacity)) {
    return 'Event capacity has been reached. Choose another event.';
  }

  return null;
}
