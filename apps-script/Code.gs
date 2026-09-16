const SPREADSHEET_ID = '1oJkYUXZ2JFKn-C0ER7EWM6l4wXd4Z278KclYkPnZWeM';
const SHEETS = {
  users: { name: 'Users', id: 'userId' },
  events: { name: 'Events', id: 'eventId' },
  participants: { name: 'Participants', id: 'participantId' },
  registrations: { name: 'Registrations', id: 'registrationId' },
  attendance: { name: 'Attendance', id: 'attendanceId' },
};

function json_(payload, status) {
  return ContentService.createTextOutput(JSON.stringify({ ok: status !== 'error', ...payload }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(entity) {
  const config = SHEETS[String(entity || '').toLowerCase()];
  if (!config) throw new Error('Unknown entity.');
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(config.name);
  if (!sheet) throw new Error(`Missing sheet: ${config.name}`);
  return { sheet, config };
}

function rows_(entity) {
  const { sheet } = sheet_(entity);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(value => value !== '')).map(row =>
    headers.reduce((record, header, index) => { record[header] = row[index]; return record; }, {}));
}

function record_(entity, id) {
  const { config } = sheet_(entity);
  return rows_(entity).find(item => String(item[config.id]) === String(id));
}

function validate_(entity, record, existingId) {
  const required = {
    events: ['eventName', 'date', 'time', 'location', 'capacity'],
    participants: ['name', 'email'],
    registrations: ['eventId', 'participantId'],
    attendance: ['eventId', 'participantId', 'status'],
  }[entity] || [];
  required.forEach(field => { if (record[field] === undefined || record[field] === '') throw new Error(`${field} is required.`); });
  if (entity === 'events' && Number(record.capacity) <= 0) throw new Error('Capacity must be greater than zero.');
  if (entity === 'participants') {
    const duplicate = rows_(entity).some(item => String(item.email).toLowerCase() === String(record.email).toLowerCase() && String(item.participantId) !== String(existingId || ''));
    if (duplicate) throw new Error('A participant with this email already exists.');
  }
  if (entity === 'registrations') {
    if (!record_('events', record.eventId)) throw new Error('Event does not exist.');
    if (!record_('participants', record.participantId)) throw new Error('Participant does not exist.');
    if (rows_(entity).some(item => String(item.eventId) === String(record.eventId) && String(item.participantId) === String(record.participantId) && String(item.registrationId) !== String(existingId || ''))) throw new Error('Duplicate registration is not allowed.');
    const event = record_('events', record.eventId);
    const count = rows_(entity).filter(item => String(item.eventId) === String(record.eventId) && String(item.registrationId) !== String(existingId || '')).length;
    if (count >= Number(event.capacity)) throw new Error('Event capacity has been reached.');
  }
  if (entity === 'attendance') {
    if (!record_('events', record.eventId) || !record_('participants', record.participantId)) throw new Error('Attendance references an invalid event or participant.');
    if (!rows_('registrations').some(item => String(item.eventId) === String(record.eventId) && String(item.participantId) === String(record.participantId))) throw new Error('Attendance requires a valid registration.');
    if (!['Present', 'Absent'].includes(String(record.status))) throw new Error('Attendance status must be Present or Absent.');
  }
}

function doGet(e) {
  try {
    const entity = e.parameter.entity;
    const safeRows = key => rows_(key).map(item => { if (key === 'users') delete item.password; return item; });
    const data = entity ? safeRows(entity) : Object.keys(SHEETS).reduce((all, key) => { all[key] = safeRows(key); return all; }, {});
    return json_({ data });
  } catch (error) { return json_({ error: error.message }, 'error'); }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const entity = String(body.entity || '').toLowerCase();
    const operation = String(body.operation || 'create').toLowerCase();
    const { sheet, config } = sheet_(entity);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let record = body.record || {};
    if (operation === 'create') {
      if (!record[config.id]) record[config.id] = `${entity.slice(0, -1)}_${Utilities.getUuid()}`;
      validate_(entity, record);
      sheet.appendRow(headers.map(header => record[header] ?? ''));
    } else {
      const id = body.id || record[config.id];
      const values = sheet.getDataRange().getValues();
      const rowIndex = values.findIndex((row, index) => index > 0 && String(row[headers.indexOf(config.id)]) === String(id));
      if (rowIndex < 1) throw new Error('Record not found.');
      if (operation === 'update') {
        record[config.id] = id;
        validate_(entity, record, id);
        sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([headers.map(header => record[header] ?? '')]);
      } else if (operation === 'delete') {
        sheet.deleteRow(rowIndex + 1);
        if (entity === 'events' || entity === 'participants') cleanup_(entity, id);
      } else throw new Error('Operation must be create, update, or delete.');
    }
    return json_({ data: operation === 'delete' ? null : record_(entity, record[config.id] || body.id) });
  } catch (error) { return json_({ error: error.message }, 'error'); }
  finally { lock.releaseLock(); }
}

function cleanup_(entity, id) {
  const field = entity === 'events' ? 'eventId' : 'participantId';
  ['registrations', 'attendance'].forEach(target => {
    const { sheet } = sheet_(target);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const index = headers.indexOf(field);
    for (let row = values.length - 1; row > 0; row--) if (String(values[row][index]) === String(id)) sheet.deleteRow(row + 1);
  });
}
