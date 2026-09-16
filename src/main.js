import { validateRegistration } from './registrationRules.js';

const AUTH_KEY = 'eventManagement_auth';
const DATA_KEYS = {
  events: 'eventManagement_events',
  participants: 'eventManagement_participants',
  registrations: 'eventManagement_registrations',
  attendance: 'eventManagement_attendance',
};
const DEMO_USER = 'admin';
const DEMO_PASSWORD = 'admin123';
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxF1wRC-VSLLypgdAjAv4hoRzB8xa0Hio9E0x6kXUl54NhcFB1iKDshqaZqHOk3vFNt/exec';
const API_TIMEOUT_MS = 2500;

const app = document.querySelector('#app');

app.addEventListener('click', (event) => {
  const attendanceLink = event.target.closest('.nav-item[href="#attendance"]');
  if (!attendanceLink) return;
  event.preventDefault();
  history.replaceState(null, '', '#attendance');
  showAttendance();
});

function readAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    return auth?.isLoggedIn === true && auth?.username === DEMO_USER;
  } catch {
    return false;
  }
}

function readCollection(name) {
  try {
    const value = JSON.parse(localStorage.getItem(DATA_KEYS[name]));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveCollection(name, value) {
  localStorage.setItem(DATA_KEYS[name], JSON.stringify(value));
}

async function apiRequest(entity, operation = 'read', record = null, id = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const isRead = operation === 'read';
    const response = await fetch(isRead ? `${GOOGLE_SHEETS_API_URL}?entity=${encodeURIComponent(entity)}` : GOOGLE_SHEETS_API_URL, {
      method: isRead ? 'GET' : 'POST',
      headers: isRead ? undefined : { 'Content-Type': 'text/plain;charset=utf-8' },
      body: isRead ? undefined : JSON.stringify({ entity, operation, record, id }),
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || 'Google Sheets request failed.');
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

async function syncParticipantsFromApi() {
  const remote = await apiRequest('participants');
  if (!Array.isArray(remote)) throw new Error('Invalid participants response.');
  const local = readCollection('participants');
  if (remote.length === 0 && local.length > 0) {
    for (const participant of local) {
      try { await apiRequest('participants', 'create', participant); } catch { /* local fallback remains available */ }
    }
    return local;
  }
  const merged = [...remote, ...local.filter((item) => !remote.some((record) => record.participantId === item.participantId))];
  saveCollection('participants', merged);
  return merged;
}

function seedDashboardData() {
  if (localStorage.getItem(DATA_KEYS.events) !== null) return;
  const today = new Date();
  const day = (offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const registeredAt = (offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    return date.toISOString().slice(0, 10);
  };
  saveCollection('events', [
    { eventId: 'event-1', eventName: 'Community Design Workshop', description: 'A hands-on workshop for local organisers.', date: day(7), time: '09:30', location: 'Studio A', organizer: 'Events Team', capacity: 40, status: 'Upcoming' },
    { eventId: 'event-2', eventName: 'Small Business Meetup', description: 'Connect with local founders.', date: day(18), time: '18:00', location: 'City Hall', organizer: 'Events Team', capacity: 60, status: 'Upcoming' },
    { eventId: 'event-3', eventName: 'Volunteer Welcome', description: 'An introduction for new volunteers.', date: day(-10), time: '10:00', location: 'Community Room', organizer: 'Events Team', capacity: 25, status: 'Completed' },
  ]);
  saveCollection('participants', [
    { participantId: 'participant-1', name: 'Alex Tan', email: 'alex@example.com', phone: '', organisation: 'Northside Club' },
    { participantId: 'participant-2', name: 'Maya Lim', email: 'maya@example.com', phone: '', organisation: 'Local Makers' },
    { participantId: 'participant-3', name: 'Sam Lee', email: 'sam@example.com', phone: '', organisation: 'Community Hub' },
    { participantId: 'participant-4', name: 'Nora Wong', email: 'nora@example.com', phone: '', organisation: 'Independent' },
  ]);
  saveCollection('registrations', [
    { registrationId: 'registration-1', eventId: 'event-1', participantId: 'participant-1', registrationDate: registeredAt(1), status: 'Registered' },
    { registrationId: 'registration-2', eventId: 'event-1', participantId: 'participant-2', registrationDate: registeredAt(2), status: 'Registered' },
    { registrationId: 'registration-3', eventId: 'event-2', participantId: 'participant-3', registrationDate: registeredAt(0), status: 'Registered' },
    { registrationId: 'registration-4', eventId: 'event-3', participantId: 'participant-1', registrationDate: registeredAt(12), status: 'Registered' },
    { registrationId: 'registration-5', eventId: 'event-3', participantId: 'participant-4', registrationDate: registeredAt(13), status: 'Registered' },
  ]);
  saveCollection('attendance', [
    { attendanceId: 'attendance-1', eventId: 'event-3', participantId: 'participant-1', status: 'Present' },
    { attendanceId: 'attendance-2', eventId: 'event-3', participantId: 'participant-4', status: 'Present' },
    { attendanceId: 'attendance-3', eventId: 'event-1', participantId: 'participant-1', status: 'Present' },
    { attendanceId: 'attendance-4', eventId: 'event-1', participantId: 'participant-2', status: 'Absent' },
  ]);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function showLogin(message = '') {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <div class="brand-mark" aria-hidden="true">EM</div>
        <p class="eyebrow">EVENT MANAGEMENT SYSTEM</p>
        <h1 id="login-title">Welcome back</h1>
        <p class="intro">Sign in to manage your events and participants.</p>
        <form id="login-form" novalidate>
          <label for="username">Username</label>
          <input id="username" name="username" type="text" autocomplete="username" required />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
          <p class="error" id="login-error" role="alert">${message}</p>
          <button class="primary-button" type="submit">Log in</button>
        </form>
        <p class="demo-hint">Demo account: <strong>admin</strong> / <strong>admin123</strong></p>
      </section>
    </main>`;

  app.querySelector('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (username !== DEMO_USER || password !== DEMO_PASSWORD) {
      app.querySelector('#login-error').textContent = 'Username or password is incorrect.';
      return;
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: true, username }));
    if (location.hash === '#events') showEvents();
    else if (location.hash === '#participants') showParticipants();
    else if (location.hash === '#registrations') showRegistrations();
    else if (location.hash === '#attendance') showAttendance();
    else showDashboard();
  });
}

function showDashboard() {
  if (!readAuth()) {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
    return;
  }
  seedDashboardData();
  const events = readCollection('events');
  const participants = readCollection('participants');
  const registrations = readCollection('registrations');
  const attendance = readCollection('attendance');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.date >= today && !['Completed', 'Cancelled'].includes(event.status)).sort((a, b) => a.date.localeCompare(b.date));
  const presentCount = attendance.filter((record) => record.status === 'Present').length;
  const attendanceRate = registrations.length ? Math.round((presentCount / registrations.length) * 100) : 0;
  const recentRegistrations = [...registrations].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate)).slice(0, 5);
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const participantsById = new Map(participants.map((participant) => [participant.participantId, participant]));
  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">EM</span><span>EventDesk</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a class="nav-item active" href="#dashboard" aria-current="page"><span class="nav-symbol">▦</span>Dashboard</a>
          <a class="nav-item" href="#events"><span class="nav-symbol">▣</span>Events</a>
          <a class="nav-item" href="#participants"><span class="nav-symbol">♙</span>Participants</a>
          <a class="nav-item" href="#registrations"><span class="nav-symbol">≡</span>Registrations</a>
          <a class="nav-item" href="#attendance"><span class="nav-symbol">✓</span>Attendance</a>
        </nav>
        <div class="sidebar-footer"><span class="avatar">A</span><span class="user-details"><strong>Admin</strong><small>Demo account</small></span><button id="logout" class="logout-button" type="button" aria-label="Log out" title="Log out">↪</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><span class="breadcrumb">Workspace <span>/</span> Dashboard</span><span class="status-pill"><i></i> Demo mode</span></header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">OVERVIEW</p><h1>Good to see you, Admin</h1><p class="intro">Here’s what’s happening in your event workspace.</p></div><span class="date-label">${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
          <section class="stat-grid" aria-label="Event statistics">
            <article class="stat-card"><span>Total Events</span><strong>${events.length}</strong><small>All events in your workspace</small></article>
            <article class="stat-card"><span>Upcoming Events</span><strong>${upcoming.length}</strong><small>Scheduled from today onward</small></article>
            <article class="stat-card"><span>Total Participants</span><strong>${participants.length}</strong><small>People in your directory</small></article>
            <article class="stat-card"><span>Total Registrations</span><strong>${registrations.length}</strong><small>Event sign-ups recorded</small></article>
            <article class="stat-card attendance-stat"><span>Attendance Rate</span><strong>${attendanceRate}%</strong><small>${presentCount} present of ${registrations.length} registrations</small></article>
          </section>
          <div class="dashboard-columns">
            <section class="content-card"><div class="section-heading"><div><h2>Upcoming Events</h2><p>What’s coming up next</p></div><button class="text-action" data-action="event">Add event</button></div>
              ${upcoming.length ? `<div class="event-list">${upcoming.slice(0, 4).map((event) => `<article class="event-row"><div class="event-date"><strong>${new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit' })}</strong><span>${new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span></div><div class="row-main"><strong>${escapeHtml(event.eventName)}</strong><span>${escapeHtml(event.time)} · ${escapeHtml(event.location)}</span></div><span class="status-tag">${escapeHtml(event.status)}</span></article>`).join('')}</div>` : '<div class="empty-state">No upcoming events. Add an event to get started.</div>'}
            </section>
            <section class="content-card"><div class="section-heading"><div><h2>Quick Actions</h2><p>Common tasks, one click away</p></div></div><div class="quick-actions"><button data-action="event"><span>＋</span><span><strong>Create event</strong><small>Plan an upcoming event</small></span><b>›</b></button><button data-action="participant"><span>♙</span><span><strong>Add participant</strong><small>Grow your participant list</small></span><b>›</b></button><button data-action="registration"><span>≡</span><span><strong>Register participant</strong><small>Link a person to an event</small></span><b>›</b></button><button data-action="attendance"><span>✓</span><span><strong>Mark attendance</strong><small>Record who was present</small></span><b>›</b></button></div></section>
            <section class="content-card recent-card"><div class="section-heading"><div><h2>Recent Registrations</h2><p>Latest participant sign-ups</p></div><button class="text-action" data-action="registration">Register participant</button></div>
              ${recentRegistrations.length ? `<div class="table-wrap"><table><thead><tr><th>Participant</th><th>Event</th><th>Registered</th><th>Status</th></tr></thead><tbody>${recentRegistrations.map((registration) => { const person = participantsById.get(registration.participantId); const event = eventsById.get(registration.eventId); return `<tr><td><strong>${escapeHtml(person?.name ?? 'Unknown participant')}</strong><small>${escapeHtml(person?.email ?? '')}</small></td><td>${escapeHtml(event?.eventName ?? 'Unknown event')}</td><td>${formatDate(registration.registrationDate)}</td><td><span class="status-tag">${escapeHtml(registration.status || 'Registered')}</span></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state">No registrations yet. Register a participant for an event.</div>'}
            </section>
          </div>
          <dialog class="action-dialog" id="action-dialog"><form id="action-form" method="dialog"><div class="dialog-heading"><h2 id="dialog-title">Quick action</h2><button class="icon-button" value="cancel" aria-label="Close">×</button></div><div id="dialog-fields"></div><p class="error" id="action-error" role="alert"></p><div class="dialog-actions"><button class="secondary-button" value="cancel">Cancel</button><button class="primary-button" id="save-action" value="default">Save</button></div></form></dialog>
          <p class="prototype-note">This is a workshop prototype. Demo sign-in is not production-grade security.</p>
        </section>
      </main>
    </div>`;
  app.querySelector('#logout').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
  });
  app.querySelector('.nav-item[href="#events"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#events');
    showEvents();
  });
  app.querySelector('.nav-item[href="#participants"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#participants');
    showParticipants();
  });
  app.querySelector('.nav-item[href="#registrations"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#registrations');
    showRegistrations();
  });
  app.querySelectorAll('.nav-item.disabled').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
  app.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => openAction(button.dataset.action)));
  app.querySelector('#action-form').addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    saveAction();
  });
}

function showEvents(state = { search: '', status: 'All statuses', sort: 'asc' }) {
  if (!readAuth()) {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
    return;
  }
  seedDashboardData();
  const events = readCollection('events');
  const registrations = readCollection('registrations');
  const registrationCounts = new Map();
  registrations.forEach((registration) => registrationCounts.set(registration.eventId, (registrationCounts.get(registration.eventId) || 0) + 1));
  const query = state.search.trim().toLowerCase();
  const filteredEvents = events
    .filter((event) => `${event.eventName} ${event.location}`.toLowerCase().includes(query))
    .filter((event) => state.status === 'All statuses' || event.status === state.status)
    .sort((a, b) => (state.sort === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">EM</span><span>EventDesk</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a class="nav-item" href="#dashboard"><span class="nav-symbol">▦</span>Dashboard</a>
          <a class="nav-item active" href="#events" aria-current="page"><span class="nav-symbol">▣</span>Events</a>
          <a class="nav-item" href="#participants"><span class="nav-symbol">♙</span>Participants</a>
          <a class="nav-item" href="#registrations"><span class="nav-symbol">≡</span>Registrations</a>
          <a class="nav-item" href="#attendance"><span class="nav-symbol">✓</span>Attendance</a>
        </nav>
        <div class="sidebar-footer"><span class="avatar">A</span><span class="user-details"><strong>Admin</strong><small>Demo account</small></span><button id="logout" class="logout-button" type="button" aria-label="Log out" title="Log out">↪</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><span class="breadcrumb">Workspace <span>/</span> Events</span><span class="status-pill"><i></i> Demo mode</span></header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">WORKSPACE</p><h1>Events</h1><p class="intro">Browse and find events in your workspace.</p></div><span class="date-label">${events.length} ${events.length === 1 ? 'event' : 'events'}</span></div>
          <section class="events-panel" aria-label="Events list">
            <div class="events-toolbar"><label class="search-field"><span class="sr-only">Search events</span><span aria-hidden="true">⌕</span><input id="event-search" type="search" placeholder="Search events or locations…" value="${escapeHtml(state.search)}"></label><label class="filter-control">Status<select id="event-status"><option${state.status === 'All statuses' ? ' selected' : ''}>All statuses</option>${['Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => `<option${state.status === status ? ' selected' : ''}>${status}</option>`).join('')}</select></label><label class="filter-control">Date order<select id="event-sort"><option value="asc"${state.sort === 'asc' ? ' selected' : ''}>Soonest first</option><option value="desc"${state.sort === 'desc' ? ' selected' : ''}>Latest first</option></select></label></div>
            <div class="events-table-wrap"><table class="events-table"><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Capacity</th><th>Status</th><th>Registration Count</th><th>Actions</th></tr></thead><tbody>${filteredEvents.map((event) => `<tr><td><strong>${escapeHtml(event.eventName || 'Untitled event')}</strong></td><td>${escapeHtml(formatDate(event.date))}</td><td>${escapeHtml(event.time || '—')}</td><td>${escapeHtml(event.location || '—')}</td><td>${Number(event.capacity) || 0}</td><td><span class="status-tag status-${escapeHtml(String(event.status || 'Draft').toLowerCase())}">${escapeHtml(event.status || 'Draft')}</span></td><td>${registrationCounts.get(event.eventId) || 0}</td><td><button class="text-action" data-edit-event="${escapeHtml(event.eventId)}">Edit</button><button class="text-action danger-action" data-delete-event="${escapeHtml(event.eventId)}">Delete</button></td></tr>`).join('')}</tbody></table></div>
            ${filteredEvents.length === 0 ? `<div class="events-empty"><span class="empty-icon" aria-hidden="true">▣</span><h2>${events.length ? 'No matching events' : 'No events yet'}</h2><p>${events.length ? 'Try changing your search or status filter.' : 'Events you create will appear here.'}</p></div>` : ''}
          </section>
          <p class="prototype-note">This is a workshop prototype. Demo sign-in is not production-grade security.</p>
        </section>
      </main>
    </div>`;
  app.querySelector('#logout').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
  });
  app.querySelector('.nav-item[href="#dashboard"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#dashboard');
    showDashboard();
  });
  app.querySelector('.nav-item[href="#participants"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#participants');
    showParticipants();
  });
  app.querySelector('.nav-item[href="#registrations"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#registrations');
    showRegistrations();
  });
  app.querySelectorAll('.nav-item.disabled').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
  app.querySelector('#event-search').addEventListener('input', (event) => {
    const search = event.target.value;
    const cursor = event.target.selectionStart;
    showEvents({ ...state, search });
    const input = app.querySelector('#event-search');
    input.focus();
    input.setSelectionRange(cursor, cursor);
  });
  app.querySelector('#event-status').addEventListener('change', (event) => {
    const status = event.target.value;
    showEvents({ ...state, status });
    app.querySelector('#event-status').focus();
  });
  app.querySelector('#event-sort').addEventListener('change', (event) => {
    const sort = event.target.value;
    showEvents({ ...state, sort });
    app.querySelector('#event-sort').focus();
  });
  app.querySelectorAll('[data-edit-event]').forEach((button) => button.addEventListener('click', () => editEvent(button.dataset.editEvent)));
  app.querySelectorAll('[data-delete-event]').forEach((button) => button.addEventListener('click', () => deleteEvent(button.dataset.deleteEvent)));
}

function showParticipants(state = { search: '' }) {
  if (!readAuth()) {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
    return;
  }
  seedDashboardData();
  const participants = readCollection('participants');
  const localSnapshot = JSON.stringify(participants);
  const registrations = readCollection('registrations');
  const query = state.search.trim().toLowerCase();
  const filteredParticipants = participants.filter((participant) => `${participant.name} ${participant.email} ${participant.phone} ${participant.organisation}`.toLowerCase().includes(query));
  const registrationCounts = new Map();
  registrations.forEach((registration) => registrationCounts.set(registration.participantId, (registrationCounts.get(registration.participantId) || 0) + 1));
  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">EM</span><span>EventDesk</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a class="nav-item" href="#dashboard"><span class="nav-symbol">▦</span>Dashboard</a>
          <a class="nav-item" href="#events"><span class="nav-symbol">▣</span>Events</a>
          <a class="nav-item active" href="#participants" aria-current="page"><span class="nav-symbol">♙</span>Participants</a>
          <a class="nav-item" href="#registrations"><span class="nav-symbol">≡</span>Registrations</a>
          <a class="nav-item" href="#attendance"><span class="nav-symbol">✓</span>Attendance</a>
        </nav>
        <div class="sidebar-footer"><span class="avatar">A</span><span class="user-details"><strong>Admin</strong><small>Demo account</small></span><button id="logout" class="logout-button" type="button" aria-label="Log out" title="Log out">↪</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><span class="breadcrumb">Workspace <span>/</span> Participants</span><span class="status-pill"><i></i> Demo mode</span></header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">WORKSPACE</p><h1>Participants</h1><p class="intro">Browse the people in your event directory.</p></div><div><button class="primary-button" data-action="participant" type="button">Add participant</button><span class="date-label">${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}</span></div></div>
          <section class="events-panel participants-panel" aria-label="Participants list">
            <div class="events-toolbar"><label class="search-field"><span class="sr-only">Search participants</span><span aria-hidden="true">⌕</span><input id="participant-search" type="search" placeholder="Search name, email, phone or organisation…" value="${escapeHtml(state.search)}"></label></div>
            <div class="events-table-wrap"><table class="participants-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Organisation</th><th>Registration Count</th><th>Actions</th></tr></thead><tbody>${filteredParticipants.map((participant) => `<tr><td><strong>${escapeHtml(participant.name || 'Unnamed participant')}</strong></td><td>${escapeHtml(participant.email || '—')}</td><td>${escapeHtml(participant.phone || '—')}</td><td>${escapeHtml(participant.organisation || '—')}</td><td>${registrationCounts.get(participant.participantId) || 0}</td><td><button class="text-action" data-edit-participant="${escapeHtml(participant.participantId)}">Edit</button><button class="text-action danger-action" data-delete-participant="${escapeHtml(participant.participantId)}">Delete</button></td></tr>`).join('')}</tbody></table></div>
            ${filteredParticipants.length === 0 ? `<div class="events-empty"><span class="empty-icon" aria-hidden="true">♙</span><h2>${participants.length ? 'No matching participants' : 'No participants yet'}</h2><p>${participants.length ? 'Try another name, email, phone number, or organisation.' : 'Participants you add will appear here.'}</p></div>` : ''}
          </section>
          <dialog class="action-dialog" id="action-dialog"><form id="action-form" method="dialog"><div class="dialog-heading"><h2 id="dialog-title">Add participant</h2><button class="icon-button" value="cancel" aria-label="Close">×</button></div><div id="dialog-fields"></div><p class="error" id="action-error" role="alert"></p><div class="dialog-actions"><button class="secondary-button" value="cancel">Cancel</button><button class="primary-button" id="save-action" value="default">Save</button></div></form></dialog>
          <p class="prototype-note">This is a workshop prototype. Demo sign-in is not production-grade security.</p>
        </section>
      </main>
    </div>`;
  app.querySelector('#logout').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
  });
  app.querySelector('.nav-item[href="#dashboard"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#dashboard');
    showDashboard();
  });
  app.querySelector('.nav-item[href="#events"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#events');
    showEvents();
  });
  app.querySelector('.nav-item[href="#registrations"]').addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#registrations');
    showRegistrations();
  });
  app.querySelectorAll('.nav-item.disabled').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
  app.querySelector('#participant-search').addEventListener('input', (event) => {
    const search = event.target.value;
    const cursor = event.target.selectionStart;
    showParticipants({ search });
    const input = app.querySelector('#participant-search');
    input.focus();
    input.setSelectionRange(cursor, cursor);
  });
  app.querySelectorAll('[data-edit-participant]').forEach((button) => button.addEventListener('click', () => editParticipant(button.dataset.editParticipant)));
  app.querySelectorAll('[data-delete-participant]').forEach((button) => button.addEventListener('click', () => deleteParticipant(button.dataset.deleteParticipant)));
  app.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => openAction(button.dataset.action)));
  app.querySelector('#action-form').addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    saveAction();
  });
  syncParticipantsFromApi().then((remote) => {
    if (JSON.stringify(remote) !== localSnapshot && readAuth()) showParticipants({ search: state.search });
  }).catch(() => {});
}

function showRegistrations(feedback = '') {
  if (!readAuth()) {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
    return;
  }
  seedDashboardData();
  const events = readCollection('events');
  const participants = readCollection('participants');
  const registrations = readCollection('registrations');
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const participantsById = new Map(participants.map((participant) => [participant.participantId, participant]));
  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">EM</span><span>EventDesk</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a class="nav-item" href="#dashboard"><span class="nav-symbol">▦</span>Dashboard</a>
          <a class="nav-item" href="#events"><span class="nav-symbol">▣</span>Events</a>
          <a class="nav-item" href="#participants"><span class="nav-symbol">♙</span>Participants</a>
          <a class="nav-item active" href="#registrations" aria-current="page"><span class="nav-symbol">≡</span>Registrations</a>
          <a class="nav-item" href="#attendance"><span class="nav-symbol">✓</span>Attendance</a>
        </nav>
        <div class="sidebar-footer"><span class="avatar">A</span><span class="user-details"><strong>Admin</strong><small>Demo account</small></span><button id="logout" class="logout-button" type="button" aria-label="Log out" title="Log out">↪</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><span class="breadcrumb">Workspace <span>/</span> Registrations</span><span class="status-pill"><i></i> Demo mode</span></header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">WORKSPACE</p><h1>Registrations</h1><p class="intro">Register a participant for an event and review saved registrations.</p></div><span class="date-label">${registrations.length} ${registrations.length === 1 ? 'registration' : 'registrations'}</span></div>
          <section class="content-card registration-form-card"><div class="section-heading"><div><h2>Register participant</h2><p>Choose an event and a participant to create a registration.</p></div></div>
            ${!events.length || !participants.length ? `<div class="empty-state">${!events.length ? 'Add an event before creating registrations.' : 'Add a participant before creating registrations.'}</div>` : `<form id="registration-form" class="registration-form" novalidate>
              <label>Event<select name="eventId" id="registration-event"><option value="">Select an event</option>${events.map((event) => `<option value="${escapeHtml(event.eventId)}">${escapeHtml(event.eventName)}</option>`).join('')}</select><small id="capacity-hint">Choose an event to see remaining capacity.</small></label>
              <label>Participant<select name="participantId" id="registration-participant"><option value="">Select a participant</option>${participants.map((participant) => `<option value="${escapeHtml(participant.participantId)}">${escapeHtml(participant.name)} · ${escapeHtml(participant.email)}</option>`).join('')}</select></label>
              <div class="registration-submit"><p id="registration-message" class="form-message" role="status">${escapeHtml(feedback)}</p><button class="primary-button" type="submit">Create registration</button></div>
            </form>`}
          </section>
          <section class="content-card registration-list-card"><div class="section-heading"><div><h2>Registration records</h2><p>Current event sign-ups</p></div></div>
            ${registrations.length ? `<div class="table-wrap"><table><thead><tr><th>Participant</th><th>Event</th><th>Registration Date</th><th>Status</th></tr></thead><tbody>${[...registrations].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate)).map((registration) => { const participant = participantsById.get(registration.participantId); const event = eventsById.get(registration.eventId); return `<tr><td>${escapeHtml(participant?.name ?? 'Unknown participant')}</td><td>${escapeHtml(event?.eventName ?? 'Unknown event')}</td><td>${escapeHtml(registration.registrationDate || '—')}</td><td><span class="status-tag">${escapeHtml(registration.status || 'Registered')}</span></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state">No registrations yet. Create one using the form above.</div>'}
          </section>
          <p class="prototype-note">This is a workshop prototype. Demo sign-in is not production-grade security.</p>
        </section>
      </main>
    </div>`;
  app.querySelector('#logout').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
  });
  app.querySelector('.nav-item[href="#dashboard"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#dashboard'); showDashboard(); });
  app.querySelector('.nav-item[href="#events"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#events'); showEvents(); });
  app.querySelector('.nav-item[href="#participants"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#participants'); showParticipants(); });
  app.querySelectorAll('.nav-item.disabled').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
  const form = app.querySelector('#registration-form');
  if (!form) return;
  const eventSelect = app.querySelector('#registration-event');
  const participantSelect = app.querySelector('#registration-participant');
  const message = app.querySelector('#registration-message');
  const capacityHint = app.querySelector('#capacity-hint');
  const updateCapacityHint = () => {
    const event = readCollection('events').find((item) => item.eventId === eventSelect.value);
    if (!event) { capacityHint.textContent = 'Choose an event to see remaining capacity.'; return; }
    const registeredCount = readCollection('registrations').filter((item) => item.eventId === event.eventId).length;
    capacityHint.textContent = `${registeredCount} of ${Number(event.capacity) || 0} places registered.`;
  };
  eventSelect.addEventListener('change', updateCapacityHint);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.className = 'form-message error-message';
    const currentEvents = readCollection('events');
    const currentParticipants = readCollection('participants');
    const currentRegistrations = readCollection('registrations');
    const selectedEvent = currentEvents.find((item) => item.eventId === eventSelect.value);
    const selectedParticipant = currentParticipants.find((item) => item.participantId === participantSelect.value);
    const validationMessage = validateRegistration(eventSelect.value, participantSelect.value, currentEvents, currentParticipants, currentRegistrations);
    if (validationMessage) { message.textContent = validationMessage; return; }
    currentRegistrations.push({ registrationId: makeId('registration'), eventId: selectedEvent.eventId, participantId: selectedParticipant.participantId, registrationDate: new Date().toISOString().slice(0, 10), status: 'Registered' });
    saveCollection('registrations', currentRegistrations);
    showRegistrations('Registration created successfully.');
  });
}

function showAttendance(eventId = '', feedback = '') {
  if (!readAuth()) {
    localStorage.removeItem(AUTH_KEY);
    showLogin();
    return;
  }
  seedDashboardData();
  const events = readCollection('events');
  const participants = readCollection('participants');
  const registrations = readCollection('registrations');
  const attendance = readCollection('attendance');
  const selectedEvent = events.find((event) => event.eventId === eventId) || events[0] || null;
  const selectedEventId = selectedEvent?.eventId || '';
  const registeredIds = new Set(registrations.filter((item) => item.eventId === selectedEventId).map((item) => item.participantId));
  const eventParticipants = participants.filter((participant) => registeredIds.has(participant.participantId));
  const statuses = new Map(attendance.filter((item) => item.eventId === selectedEventId && registeredIds.has(item.participantId)).map((item) => [item.participantId, item.status]));
  const presentCount = eventParticipants.filter((participant) => statuses.get(participant.participantId) === 'Present').length;
  const absentCount = eventParticipants.filter((participant) => statuses.get(participant.participantId) === 'Absent').length;
  const unmarkedCount = eventParticipants.length - presentCount - absentCount;
  app.innerHTML = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">EM</span><span>EventDesk</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a class="nav-item" href="#dashboard"><span class="nav-symbol">▦</span>Dashboard</a>
          <a class="nav-item" href="#events"><span class="nav-symbol">▣</span>Events</a>
          <a class="nav-item" href="#participants"><span class="nav-symbol">♙</span>Participants</a>
          <a class="nav-item" href="#registrations"><span class="nav-symbol">≡</span>Registrations</a>
          <a class="nav-item active" href="#attendance" aria-current="page"><span class="nav-symbol">✓</span>Attendance</a>
        </nav>
        <div class="sidebar-footer"><span class="avatar">A</span><span class="user-details"><strong>Admin</strong><small>Demo account</small></span><button id="logout" class="logout-button" type="button" aria-label="Log out" title="Log out">↪</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><span class="breadcrumb">Workspace <span>/</span> Attendance</span><span class="status-pill"><i></i> Demo mode</span></header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">WORKSPACE</p><h1>Attendance</h1><p class="intro">Mark attendance for participants registered to an event.</p></div><span class="date-label">${eventParticipants.length} registered</span></div>
          ${events.length ? `<section class="content-card attendance-picker"><label for="attendance-event">Event</label><select id="attendance-event">${events.map((event) => `<option value="${escapeHtml(event.eventId)}"${event.eventId === selectedEventId ? ' selected' : ''}>${escapeHtml(event.eventName)}</option>`).join('')}</select>${feedback ? `<p class="attendance-feedback" role="status">${escapeHtml(feedback)}</p>` : ''}</section>` : `<section class="content-card"><div class="empty-state">No events yet. Create an event before taking attendance.</div></section>`}
          ${events.length && eventParticipants.length ? `<section class="attendance-summary" aria-label="Attendance summary"><article class="stat-card"><span>Total Registered</span><strong>${eventParticipants.length}</strong></article><article class="stat-card"><span>Present</span><strong>${presentCount}</strong></article><article class="stat-card"><span>Absent</span><strong>${absentCount}</strong></article><article class="stat-card"><span>Not Marked</span><strong>${unmarkedCount}</strong></article></section>
            <section class="content-card attendance-list"><div class="section-heading"><div><h2>${escapeHtml(selectedEvent.eventName)}</h2><p>Only registered participants are listed here.</p></div></div><div class="table-wrap"><table><thead><tr><th>Participant</th><th>Email</th><th>Attendance</th><th>Mark status</th></tr></thead><tbody>${eventParticipants.map((participant) => { const status = statuses.get(participant.participantId); return `<tr><td><strong>${escapeHtml(participant.name)}</strong></td><td>${escapeHtml(participant.email)}</td><td>${status ? `<span class="status-tag attendance-${status.toLowerCase()}">${status}</span>` : '<span class="unmarked-label">Not marked</span>'}</td><td><div class="attendance-actions"><button type="button" class="attendance-button present-button${status === 'Present' ? ' selected' : ''}" data-participant-id="${escapeHtml(participant.participantId)}" data-status="Present" aria-pressed="${status === 'Present'}">Present</button><button type="button" class="attendance-button absent-button${status === 'Absent' ? ' selected' : ''}" data-participant-id="${escapeHtml(participant.participantId)}" data-status="Absent" aria-pressed="${status === 'Absent'}">Absent</button></div></td></tr>`; }).join('')}</tbody></table></div></section>` : events.length ? `<section class="content-card attendance-list"><div class="events-empty"><span class="empty-icon" aria-hidden="true">✓</span><h2>No registered participants</h2><p>Register participants for this event before taking attendance.</p></div></section>` : ''}
          <p class="prototype-note">This is a workshop prototype. Demo sign-in is not production-grade security.</p>
        </section>
      </main>
    </div>`;
  app.querySelector('#logout').addEventListener('click', () => { localStorage.removeItem(AUTH_KEY); showLogin(); });
  app.querySelector('.nav-item[href="#dashboard"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#dashboard'); showDashboard(); });
  app.querySelector('.nav-item[href="#events"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#events'); showEvents(); });
  app.querySelector('.nav-item[href="#participants"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#participants'); showParticipants(); });
  app.querySelector('.nav-item[href="#registrations"]').addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', '#registrations'); showRegistrations(); });
  const eventSelect = app.querySelector('#attendance-event');
  if (!eventSelect) return;
  eventSelect.addEventListener('change', () => showAttendance(eventSelect.value));
  app.querySelectorAll('.attendance-button').forEach((button) => button.addEventListener('click', () => {
    const currentRegistrations = readCollection('registrations');
    const stillRegistered = currentRegistrations.some((registration) => registration.eventId === selectedEventId && registration.participantId === button.dataset.participantId);
    if (!stillRegistered) {
      showAttendance(selectedEventId, 'Attendance can only be marked for a participant registered to this event.');
      return;
    }
    const records = readCollection('attendance');
    const existing = records.find((record) => record.eventId === selectedEventId && record.participantId === button.dataset.participantId);
    if (existing) existing.status = button.dataset.status;
    else records.push({ attendanceId: makeId('attendance'), eventId: selectedEventId, participantId: button.dataset.participantId, status: button.dataset.status });
    saveCollection('attendance', records);
    showAttendance(selectedEventId, `${button.dataset.status} status saved.`);
  }));
}

function editEvent(id) {
  const events = readCollection('events'); const event = events.find((item) => item.eventId === id); if (!event) return;
  const name = prompt('Event name', event.eventName); if (name === null) return;
  const date = prompt('Date (YYYY-MM-DD)', event.date); if (date === null) return;
  const location = prompt('Location', event.location); if (location === null) return;
  const capacity = Number(prompt('Capacity', event.capacity)); if (!capacity || capacity < 1) return alert('Capacity must be greater than zero.');
  event.eventName = name.trim(); event.date = date.trim(); event.location = location.trim(); event.capacity = capacity; saveCollection('events', events); showEvents();
}

function deleteEvent(id) {
  if (!confirm('Delete this event and its registrations and attendance?')) return;
  saveCollection('events', readCollection('events').filter((item) => item.eventId !== id));
  saveCollection('registrations', readCollection('registrations').filter((item) => item.eventId !== id));
  saveCollection('attendance', readCollection('attendance').filter((item) => item.eventId !== id)); showEvents();
}

function editParticipant(id) {
  const participants = readCollection('participants'); const participant = participants.find((item) => item.participantId === id); if (!participant) return;
  const name = prompt('Name', participant.name); if (name === null) return;
  const email = prompt('Email', participant.email); if (email === null) return;
  if (participants.some((item) => item.participantId !== id && item.email.toLowerCase() === email.trim().toLowerCase())) return alert('A participant with this email already exists.');
  const organisation = prompt('Organisation', participant.organisation); if (organisation === null) return;
  participant.name = name.trim(); participant.email = email.trim().toLowerCase(); participant.organisation = organisation.trim(); saveCollection('participants', participants); showParticipants();
}

function deleteParticipant(id) {
  if (!confirm('Delete this participant and related registrations and attendance?')) return;
  saveCollection('participants', readCollection('participants').filter((item) => item.participantId !== id));
  saveCollection('registrations', readCollection('registrations').filter((item) => item.participantId !== id));
  saveCollection('attendance', readCollection('attendance').filter((item) => item.participantId !== id)); showParticipants();
}

function openAction(action) {
  const events = readCollection('events');
  const participants = readCollection('participants');
  const dialog = app.querySelector('#action-dialog');
  const labels = { event: 'Create event', participant: 'Add participant', registration: 'Register participant', attendance: 'Mark attendance' };
  app.querySelector('#dialog-title').textContent = labels[action];
  app.querySelector('#action-error').textContent = '';
  const eventOptions = events.map((event) => `<option value="${escapeHtml(event.eventId)}">${escapeHtml(event.eventName)}</option>`).join('');
  const participantOptions = participants.map((participant) => `<option value="${escapeHtml(participant.participantId)}">${escapeHtml(participant.name)}</option>`).join('');
  const fields = {
    event: '<label>Event name<input name="eventName" required></label><label>Date<input name="date" type="date" required></label><label>Time<input name="time" type="time" required></label><label>Location<input name="location" required></label><label>Capacity<input name="capacity" type="number" min="1" required></label>',
    participant: '<label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Organisation<input name="organisation"></label>',
    registration: `<label>Event<select name="eventId" required>${eventOptions}</select></label><label>Participant<select name="participantId" required>${participantOptions}</select></label>`,
    attendance: `<label>Event<select name="eventId" required>${eventOptions}</select></label><label>Participant<select name="participantId" required>${participantOptions}</select></label><label>Attendance status<select name="status"><option>Present</option><option>Absent</option></select></label>`,
  };
  app.querySelector('#dialog-fields').innerHTML = fields[action];
  app.querySelector('#action-form').dataset.action = action;
  if ((action === 'registration' || action === 'attendance') && (!events.length || !participants.length)) {
    app.querySelector('#action-error').textContent = 'Add at least one event and one participant first.';
    app.querySelector('#save-action').disabled = true;
  } else app.querySelector('#save-action').disabled = false;
  if (action === 'attendance') updateParticipantOptions();
  dialog.showModal();
  const eventSelect = app.querySelector('#dialog-fields select[name="eventId"]');
  if (eventSelect) eventSelect.addEventListener('change', updateParticipantOptions);
}

function updateParticipantOptions() {
  const eventId = app.querySelector('#dialog-fields select[name="eventId"]')?.value;
  const participantSelect = app.querySelector('#dialog-fields select[name="participantId"]');
  if (!participantSelect) return;
  let participants = readCollection('participants');
  if (app.querySelector('#action-form').dataset.action === 'attendance') {
    const registrations = readCollection('registrations').filter((item) => item.eventId === eventId);
    const ids = new Set(registrations.map((item) => item.participantId));
    participants = participants.filter((item) => ids.has(item.participantId));
  }
  participantSelect.innerHTML = participants.map((participant) => `<option value="${escapeHtml(participant.participantId)}">${escapeHtml(participant.name)}</option>`).join('');
}

async function saveAction() {
  const form = app.querySelector('#action-form');
  const fields = new FormData(form);
  const action = form.dataset.action;
  const error = app.querySelector('#action-error');
  const events = readCollection('events');
  const participants = readCollection('participants');
  if (!form.reportValidity()) return;
  if (action === 'event') {
    const capacity = Number(fields.get('capacity'));
    if (capacity <= 0) { error.textContent = 'Capacity must be greater than zero.'; return; }
    events.push({ eventId: makeId('event'), eventName: String(fields.get('eventName')).trim(), description: '', date: fields.get('date'), time: fields.get('time'), location: String(fields.get('location')).trim(), organizer: 'Events Team', capacity, status: 'Upcoming' });
    saveCollection('events', events);
  } else if (action === 'participant') {
    const email = String(fields.get('email')).trim().toLowerCase();
    if (participants.some((person) => person.email.toLowerCase() === email)) { error.textContent = 'A participant with this email already exists.'; return; }
    const participant = { participantId: makeId('participant'), name: String(fields.get('name')).trim(), email, phone: '', organisation: String(fields.get('organisation')).trim() };
    participants.push(participant);
    saveCollection('participants', participants);
    try { await apiRequest('participants', 'create', participant); } catch { /* localStorage remains the fallback */ }
  } else if (action === 'registration') {
    const event = events.find((item) => item.eventId === fields.get('eventId'));
    const participant = participants.find((item) => item.participantId === fields.get('participantId'));
    const registrations = readCollection('registrations');
    const validationMessage = validateRegistration(fields.get('eventId'), fields.get('participantId'), events, participants, registrations);
    if (validationMessage) { error.textContent = validationMessage; return; }
    registrations.push({ registrationId: makeId('registration'), eventId: event.eventId, participantId: participant.participantId, registrationDate: new Date().toISOString().slice(0, 10), status: 'Registered' });
    saveCollection('registrations', registrations);
  } else if (action === 'attendance') {
    const eventId = fields.get('eventId');
    const participantId = fields.get('participantId');
    if (!readCollection('registrations').some((item) => item.eventId === eventId && item.participantId === participantId)) { error.textContent = 'Attendance can only be marked for a registered participant.'; return; }
    const records = readCollection('attendance');
    const existing = records.find((item) => item.eventId === eventId && item.participantId === participantId);
    if (existing) existing.status = fields.get('status');
    else records.push({ attendanceId: makeId('attendance'), eventId, participantId, status: fields.get('status') });
    saveCollection('attendance', records);
  }
  app.querySelector('#action-dialog').close();
  showDashboard();
}

const styles = `
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f3f6f4;background:#101512;font-synthesis:none;text-rendering:optimizeLegibility;font-weight:400;--muted:#929c96;--line:#29322d;--green:#1dbb78;--panel:#171e1a}
*{box-sizing:border-box}body{margin:0;min-width:320px;min-height:100vh}button,input{font:inherit}.login-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 50% 10%,#1b2a21 0,transparent 48%),#101512}.login-card{width:min(100%,420px);padding:40px;background:#171e1a;border:1px solid #29342e;border-radius:16px;box-shadow:0 24px 70px #0005}.brand-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#183b2b;color:#58e5a3;font-weight:750;letter-spacing:-.06em}.eyebrow{font-size:11px;letter-spacing:.12em;color:#78cba1;font-weight:700;margin:24px 0 10px}.login-card h1,.page-heading h1{font-size:30px;letter-spacing:-.04em;margin:0}.intro{font-size:14px;color:var(--muted);line-height:1.6;margin:9px 0 26px}.login-card form{display:grid}.login-card label{font-size:13px;font-weight:600;margin:0 0 8px}.login-card input{height:46px;background:#101512;border:1px solid #354139;border-radius:8px;padding:0 13px;color:#f3f6f4;outline:none;margin-bottom:19px}.login-card input:focus{border-color:#32cf8b;box-shadow:0 0 0 3px #32cf8b25}.primary-button{height:46px;border:0;border-radius:8px;background:var(--green);color:#07150e;font-weight:700;cursor:pointer;margin-top:2px}.primary-button:hover{background:#36ce8b}.error{min-height:20px;color:#ff938c;font-size:13px;margin:-6px 0 12px}.demo-hint{border-top:1px solid var(--line);padding-top:18px;margin:22px 0 0;color:var(--muted);font-size:12px}.demo-hint strong{color:#dce5df}.dashboard-shell{min-height:100vh;display:grid;grid-template-columns:248px 1fr}.sidebar{border-right:1px solid var(--line);background:#141a16;padding:24px 16px;display:flex;flex-direction:column}.sidebar-brand{display:flex;align-items:center;gap:11px;font-weight:700;letter-spacing:-.02em;padding:0 10px 35px}.brand-mark.small{width:34px;height:34px;border-radius:10px;font-size:12px}.nav-label{color:#758078;font-size:10px;letter-spacing:.13em;font-weight:700;padding:0 12px;margin:0 0 10px}.sidebar nav{display:grid;gap:5px}.nav-item{display:flex;align-items:center;gap:12px;text-decoration:none;color:#aab4ad;padding:11px 12px;border-radius:8px;font-size:13px}.nav-item.active{background:#1b2d23;color:#73e3aa;font-weight:650}.nav-item.disabled{opacity:.66;cursor:default}.nav-symbol{width:17px;text-align:center;font-size:16px}.sidebar-footer{margin-top:auto;border-top:1px solid var(--line);padding:18px 6px 0;display:flex;align-items:center;gap:10px}.avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#294536;color:#9cf0c2;font-size:13px;font-weight:700}.user-details{display:grid;gap:3px;flex:1}.user-details strong{font-size:12px}.user-details small{font-size:11px;color:var(--muted)}.logout-button{border:0;background:transparent;color:#aab4ad;font-size:19px;cursor:pointer;padding:5px 8px}.logout-button:hover{color:#ff938c}.main-content{min-width:0}.topbar{height:64px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 40px}.breadcrumb{font-size:12px;color:var(--muted)}.breadcrumb span{padding:0 8px;color:#556159}.status-pill{border:1px solid #354139;border-radius:99px;padding:6px 10px;font-size:11px;color:#b5c0b8}.status-pill i{display:inline-block;width:6px;height:6px;background:#56d894;border-radius:50%;margin:0 7px 1px 0}.page-content{max-width:1080px;margin:0 auto;padding:45px 40px}.page-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:30px}.page-heading .eyebrow{margin:0 0 10px}.page-heading .intro{margin:8px 0 0}.date-label{color:#a5afa8;font-size:12px;border:1px solid var(--line);border-radius:7px;padding:9px 12px}.welcome-panel{display:flex;justify-content:space-between;align-items:center;gap:24px;border:1px solid #2c3a31;border-radius:12px;padding:32px;background:linear-gradient(115deg,#19241d,#171e1a 65%)}.welcome-panel .eyebrow{margin:0 0 12px}.welcome-panel h2{font-size:22px;letter-spacing:-.03em;margin:0}.welcome-panel p:not(.eyebrow){color:var(--muted);line-height:1.7;font-size:14px;max-width:630px;margin:10px 0 0}.welcome-icon{width:48px;height:48px;flex:none;border-radius:50%;display:grid;place-items:center;color:#70e4a6;border:1px solid #376348;background:#1c3325;font-size:21px}.prototype-note{font-size:12px;color:#7e8982;margin-top:17px}
@media(max-width:760px){.dashboard-shell{grid-template-columns:1fr}.sidebar{border-right:0;border-bottom:1px solid var(--line);padding:14px 16px}.sidebar-brand{padding:0 4px 14px}.nav-label,.sidebar-footer{display:none}.sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.nav-item{padding:9px 8px;font-size:12px}.topbar{height:54px;padding:0 20px}.page-content{padding:30px 20px}.page-heading{align-items:start;gap:14px;flex-direction:column}.welcome-panel{padding:24px;align-items:start}.welcome-panel h2{font-size:20px}}@media(max-width:380px){.login-card{padding:28px 22px}.sidebar nav{grid-template-columns:1fr 1fr}.welcome-icon{display:none}}
`;
const styleElement = document.createElement('style');
styleElement.textContent = styles;
styleElement.textContent += `
.stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-bottom:20px}.stat-card{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 16px;display:grid;gap:11px}.stat-card>span{font-size:12px;color:#aab4ad}.stat-card strong{font-size:29px;line-height:1;letter-spacing:-.04em}.stat-card small{font-size:10px;line-height:1.4;color:#77827b}.attendance-stat{border-color:#31533e}.attendance-stat strong{color:#70e4a6}.dashboard-columns{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:16px}.content-card{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.section-heading h2{margin:0;font-size:15px;letter-spacing:-.02em}.section-heading p{margin:5px 0 0;color:var(--muted);font-size:11px}.text-action{border:0;background:transparent;color:#6fe1a5;font-size:11px;font-weight:650;cursor:pointer;padding:7px}.event-list,.quick-actions{display:grid}.event-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid #252e29}.event-date{width:42px;height:44px;flex:none;border:1px solid #354139;border-radius:7px;display:grid;align-content:center;justify-items:center;gap:2px}.event-date strong{font-size:16px}.event-date span{color:var(--muted);font-size:9px;text-transform:uppercase}.row-main{display:grid;gap:5px;min-width:0;flex:1}.row-main strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row-main span{font-size:10px;color:var(--muted)}.status-tag{display:inline-flex;width:max-content;padding:5px 8px;border:1px solid #31533e;border-radius:99px;background:#1a2b20;color:#8fe2ae;font-size:9px;white-space:nowrap}.quick-actions button{display:flex;align-items:center;gap:11px;text-align:left;padding:12px 2px;border:0;border-top:1px solid #252e29;background:transparent;color:#79dea6;cursor:pointer}.quick-actions button>span:first-child{width:32px;height:32px;display:grid;place-items:center;border:1px solid #334239;border-radius:8px;background:#1b241e;font-size:15px}.quick-actions button>span:nth-child(2){display:grid;gap:4px;flex:1}.quick-actions strong{font-size:11px;color:#e4ebe6}.quick-actions small{font-size:10px;color:var(--muted)}.quick-actions b{font-size:19px;font-weight:400}.recent-card{grid-column:1/-1}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#77827b;font-weight:650;padding:9px 10px;border-bottom:1px solid var(--line)}td{padding:11px 10px;border-bottom:1px solid #252e29;font-size:10px;color:#c5cec8}tbody tr:last-child td{border-bottom:0}td:first-child strong,td:first-child small{display:block}td:first-child strong{font-size:11px;color:#e6ece8}td:first-child small{font-size:9px;color:var(--muted);margin-top:4px}.empty-state{border-top:1px solid #252e29;padding:24px 8px;color:var(--muted);font-size:12px;line-height:1.6}.action-dialog{width:min(calc(100% - 32px),440px);border:1px solid #354139;border-radius:12px;background:#171e1a;color:#f3f6f4;padding:22px;box-shadow:0 25px 80px #0009}.action-dialog::backdrop{background:#060907b8;backdrop-filter:blur(2px)}.dialog-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.dialog-heading h2{font-size:18px;margin:0}.icon-button{background:transparent;border:0;color:#aab4ad;font-size:23px;cursor:pointer}.action-dialog #dialog-fields{display:grid;gap:13px}.action-dialog label{display:grid;gap:6px;color:#cbd3ce;font-size:11px;font-weight:600}.action-dialog input,.action-dialog select{width:100%;height:40px;border:1px solid #354139;border-radius:7px;background:#101512;color:#f3f6f4;padding:0 10px}.dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.dialog-actions .primary-button,.secondary-button{height:38px;padding:0 15px;margin:0;border-radius:7px;font-size:11px}.secondary-button{border:1px solid #354139;background:#202823;color:#d2dbd5;cursor:pointer}.dialog-actions button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:1050px){.stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboard-columns{grid-template-columns:1fr 1fr}}@media(max-width:760px){.dashboard-shell{grid-template-columns:1fr}.sidebar{border-right:0;border-bottom:1px solid var(--line);padding:14px 16px}.sidebar-brand{padding:0 4px 14px}.nav-label,.sidebar-footer{display:none}.sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.nav-item{padding:9px 8px;font-size:12px}.topbar{height:54px;padding:0 20px}.page-content{padding:30px 20px}.page-heading{align-items:start;gap:14px;flex-direction:column}.dashboard-columns{grid-template-columns:1fr}.recent-card{grid-column:auto}}@media(max-width:520px){.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.stat-card{padding:14px 12px}.stat-card strong{font-size:25px}.stat-card small{font-size:9px}.stat-grid .attendance-stat{grid-column:1/-1}.content-card{padding:16px}.event-row{gap:9px}.event-row .status-tag{display:none}.section-heading{align-items:flex-start}.table-wrap{margin:0 -8px}th,td{padding:10px 8px}}@media(max-width:380px){.login-card{padding:28px 22px}.sidebar nav{grid-template-columns:1fr 1fr}.welcome-icon{display:none}}
`;
styleElement.textContent += `
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.events-panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.events-toolbar{display:flex;align-items:center;gap:12px;padding:17px;border-bottom:1px solid var(--line)}.search-field{height:40px;min-width:180px;max-width:390px;flex:1;display:flex;align-items:center;gap:9px;padding:0 11px;background:#101512;border:1px solid #354139;border-radius:7px;color:#9ba69f}.search-field>span:not(.sr-only){font-size:20px}.search-field input{width:100%;border:0;outline:0;background:transparent;color:#f3f6f4;font-size:12px}.search-field input::placeholder{color:#758078}.filter-control{display:flex;align-items:center;gap:8px;color:#9ba69f;font-size:10px;white-space:nowrap}.filter-control select{height:40px;border:1px solid #354139;border-radius:7px;background:#101512;color:#e1e8e3;padding:0 27px 0 10px;font-size:11px}.events-table-wrap{width:100%;overflow:auto}.events-table{min-width:940px}.events-table th,.events-table td{padding:14px 12px}.events-table td{font-size:11px}.events-table td:first-child strong{font-size:12px}.events-table .status-tag{font-size:9px}.status-draft{color:#c6cbbd;border-color:#505346;background:#292a22}.status-upcoming{color:#8fe2ae}.status-ongoing{color:#9dc8ff;border-color:#35506c;background:#1b2733}.status-completed{color:#b7c0ba;border-color:#404a44;background:#242b27}.status-cancelled{color:#ffaaa4;border-color:#633a36;background:#30201f}.actions-placeholder{color:#77827b}.events-empty{padding:55px 20px;text-align:center}.empty-icon{width:42px;height:42px;display:grid;place-items:center;margin:0 auto 13px;border:1px solid #354139;border-radius:10px;background:#1b241e;color:#80dca7}.events-empty h2{margin:0;font-size:16px}.events-empty p{margin:8px 0 0;color:var(--muted);font-size:12px}
@media(max-width:700px){.events-toolbar{align-items:stretch;flex-direction:column}.search-field{max-width:none}.filter-control{justify-content:space-between}.filter-control select{flex:1;max-width:70%}.events-table{min-width:900px}}
`;
styleElement.textContent += `.participants-table{min-width:760px}.participants-table th,.participants-table td{padding:14px 14px}.participants-table td{font-size:11px}.participants-table td:first-child strong{font-size:12px}@media(max-width:700px){.participants-table{min-width:720px}}`;
styleElement.textContent += `.registration-form-card,.registration-list-card{margin-bottom:16px}.registration-form{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:end}.registration-form>label{display:grid;gap:7px;font-size:11px;font-weight:650;color:#cbd3ce}.registration-form select{width:100%;height:42px;border:1px solid #354139;border-radius:7px;background:#101512;color:#f3f6f4;padding:0 11px;font:inherit;font-weight:400}.registration-form select:focus{outline:0;border-color:#32cf8b;box-shadow:0 0 0 3px #32cf8b25}.registration-form label small{color:var(--muted);font-weight:400;font-size:10px}.registration-submit{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid var(--line);padding-top:14px}.registration-submit .primary-button{padding:0 17px;height:40px;margin:0}.form-message{margin:0;min-height:18px;font-size:12px}.form-message.error-message{color:#ff938c}.form-message:not(.error-message){color:#79dfa6}@media(max-width:620px){.registration-form{grid-template-columns:1fr}.registration-submit{grid-column:auto;align-items:stretch;flex-direction:column}.registration-submit .primary-button{width:100%}}`;
styleElement.textContent += `.attendance-picker{display:grid;grid-template-columns:110px minmax(200px,1fr) auto;align-items:center;gap:14px;margin-bottom:16px}.attendance-picker label{font-size:11px;font-weight:650;color:#cbd3ce}.attendance-picker select{height:42px;border:1px solid #354139;border-radius:7px;background:#101512;color:#f3f6f4;padding:0 11px}.attendance-feedback{margin:0;color:#79dfa6;font-size:11px}.attendance-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.attendance-summary .stat-card{padding:16px}.attendance-summary .stat-card strong{font-size:25px}.attendance-list{margin-bottom:16px}.attendance-actions{display:flex;gap:7px}.attendance-button{height:31px;padding:0 11px;border-radius:6px;background:#202823;border:1px solid #354139;color:#bac4bd;font-size:10px;font-weight:650;cursor:pointer}.attendance-button:hover{border-color:#637068}.present-button.selected{background:#1b3526;border-color:#38674a;color:#8fe2ae}.absent-button.selected{background:#342321;border-color:#724541;color:#ffaaa4}.attendance-present{color:#8fe2ae;border-color:#31533e;background:#1a2b20}.attendance-absent{color:#ffaaa4;border-color:#633a36;background:#30201f}.unmarked-label{color:#929c96;font-size:10px}@media(max-width:680px){.attendance-picker{grid-template-columns:1fr;gap:8px}.attendance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.attendance-actions{flex-wrap:wrap}}`;
styleElement.textContent += `
/* Focused UI polish: consistent controls, readable density, and keyboard visibility. */
/* Keep surfaces flat and restrained, per the design direction. */
.login-page{background:#101512}
.welcome-panel{background:#19211c;box-shadow:none}
.login-card{box-shadow:none}
.action-dialog{box-shadow:0 12px 28px #0007}
.action-dialog::backdrop{backdrop-filter:none}
.welcome-icon{background:#1b2a20}
.quick-actions button>span:first-child{background:#1b241e}
button,.nav-item,select,input{transition:border-color .15s ease,background-color .15s ease,box-shadow .15s ease,transform .15s ease}
button:focus-visible,.nav-item:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #58e5a3;outline-offset:2px}
.primary-button,.secondary-button{min-width:112px;padding:0 16px;letter-spacing:.01em}
.primary-button:active,.secondary-button:active,.attendance-button:active{transform:translateY(1px)}
.events-toolbar{background:#19201b}
.events-table tbody tr:hover,table tbody tr:hover{background:#1b241e}
.events-table th,.events-table td{vertical-align:middle}
.error{line-height:1.45}
.form-message{line-height:1.45}
.events-empty{background:#151c18}
@media(max-width:520px){.page-content{padding:24px 16px}.topbar{padding:0 16px}.page-heading h1{font-size:26px}.page-heading .intro{font-size:13px}.page-heading .primary-button{width:100%}.dialog-actions{flex-direction:column-reverse}.dialog-actions button{width:100%}}
`;
document.head.append(styleElement);

if (readAuth() && location.hash === '#events') showEvents();
else if (readAuth() && location.hash === '#participants') showParticipants();
else if (readAuth() && location.hash === '#registrations') showRegistrations();
else if (readAuth() && location.hash === '#attendance') showAttendance();
else if (readAuth()) showDashboard();
else showLogin();
