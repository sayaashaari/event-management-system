# Mini PRD --- Event Management System

## 1. Product Overview

**Product Name:** Event Management System\
**Project Level:** Intermediate\
**Project Type:** Frontend-only web application\
**Storage:** Browser `localStorage`  
**Deployment:** GitHub Pages (static hosting)

The Event Management System is a simple web application for managing
events, participants, registrations, and attendance.

The project is designed for a Vibe Coding workshop where participants
move through:

**IDEA → BRIEF → CONTEXT → DESIGN SYSTEM → BUILD → VERIFY → FIX → REFINE
→ SHIP**

The system should be small enough to build incrementally while
demonstrating real CRUD, data relationships, validation, dashboard
logic, and a simple static deployment workflow.

------------------------------------------------------------------------

## 2. Problem

Small events often manage information using spreadsheets, forms, or
separate documents.

This project provides one simple interface to:

-   Create and manage events
-   Manage participants
-   Register participants for events
-   Track attendance
-   View basic event statistics

------------------------------------------------------------------------

## 3. Target Users

Primary users:

-   Event organisers
-   Lecturers
-   Trainers
-   Student committees
-   Small organisations

The application is intended as a prototype and learning project, not a
production event platform.

------------------------------------------------------------------------

## 4. Goals

### Primary Goals

1.  Demonstrate a real-world CRUD application.
2.  Demonstrate client-side data persistence using `localStorage`.
3.  Demonstrate relationships between events, participants,
    registrations, and attendance.
4.  Demonstrate basic validation and business rules.
5.  Provide a clean responsive dashboard.
6.  Allow the complete project to run without a backend.
7.  Allow the finished prototype to be deployed as a static site using GitHub Pages.

### Success Criteria

The prototype should allow a user to:

-   Log in
-   Create an event
-   Edit an event
-   Delete an event
-   Add participants
-   Edit participants
-   Delete participants
-   Register participants for events
-   Prevent duplicate registrations
-   Prevent registrations beyond event capacity
-   Mark attendance
-   Calculate attendance percentage
-   Refresh the browser without losing saved data
-   Open the deployed application from a GitHub Pages URL
-   Use the main application features after deployment without broken asset paths

------------------------------------------------------------------------

## 5. User Flow

``` text
LOGIN
  ↓
DASHBOARD
  ↓
EVENTS
  ↓
EVENT DETAILS
  ↓
PARTICIPANTS
  ↓
REGISTRATION
  ↓
ATTENDANCE
```

A typical workflow:

``` text
Login
→ Create Event
→ Add Participants
→ Register Participants
→ Mark Attendance
→ Review Dashboard
```

------------------------------------------------------------------------

## 6. Functional Requirements

### 6.1 Login

Provide a simple demo login.

**Demo credentials:**

-   Username: `admin`
-   Password: `admin123`

Requirements:

-   Login form
-   Logout action
-   Persist login state in `localStorage`
-   Redirect unauthenticated users to the login screen

This is demo authentication only. It is not intended to provide
production-grade security.

------------------------------------------------------------------------

### 6.2 Dashboard

Display summary statistics:

-   Total Events
-   Upcoming Events
-   Total Participants
-   Total Registrations
-   Attendance Rate

Display useful sections such as:

-   Upcoming Events
-   Recent Registrations
-   Quick Actions

Dashboard values should be calculated from the stored application data.

------------------------------------------------------------------------

### 6.3 Event Management

Implement full CRUD.

#### Event Fields

  Field         Description
  ------------- -------------------------------------------
  Event ID      Unique event identifier
  Event Name    Name of the event
  Description   Short event description
  Date          Event date
  Time          Event time
  Location      Event location
  Organizer     Person or organisation managing the event
  Capacity      Maximum number of participants
  Status        Current event status

#### Event Status

-   Draft
-   Upcoming
-   Ongoing
-   Completed
-   Cancelled

#### Features

-   Add event
-   View event
-   Edit event
-   Delete event
-   Search events
-   Filter by status
-   Sort by date

------------------------------------------------------------------------

### 6.4 Participant Management

Implement full CRUD.

#### Participant Fields

  Field            Description
  ---------------- -------------------------------
  Participant ID   Unique participant identifier
  Name             Participant name
  Email            Participant email
  Phone            Contact number
  Organisation     Participant organisation

#### Features

-   Add participant
-   View participant
-   Edit participant
-   Delete participant
-   Search participants

------------------------------------------------------------------------

### 6.5 Registration

Allow participants to register for an event.

#### Registration Data

-   Registration ID
-   Event ID
-   Participant ID
-   Registration date
-   Registration status

#### Business Rules

1.  The selected event must exist.
2.  The selected participant must exist.
3.  A participant cannot register for the same event twice.
4.  Registration cannot exceed event capacity.
5.  Registration should update the event registration count.

------------------------------------------------------------------------

### 6.6 Attendance

Attendance applies to registered participants.

Status:

-   Present
-   Absent

Display:

-   Total registered
-   Total present
-   Total absent
-   Attendance percentage

Formula:

``` text
Attendance Rate =
(Total Present / Total Registered) × 100
```

------------------------------------------------------------------------

## 7. Data Model

The application should maintain separate collections in `localStorage`.

### Users

``` text
id
username
password
role
```

### Events

``` text
eventId
eventName
description
date
time
location
organizer
capacity
status
```

### Participants

``` text
participantId
name
email
phone
organisation
```

### Registrations

``` text
registrationId
eventId
participantId
registrationDate
status
```

### Attendance

``` text
attendanceId
eventId
participantId
status
```

------------------------------------------------------------------------

## 8. LocalStorage Strategy

Suggested keys:

``` text
eventManagement_users
eventManagement_events
eventManagement_participants
eventManagement_registrations
eventManagement_attendance
eventManagement_auth
```

All application data must persist after browser refresh.

Seed realistic demo data on first launch so the dashboard does not
appear empty.

------------------------------------------------------------------------

## 9. Validation

Implement basic client-side validation.

### Event

-   Event name is required.
-   Date is required.
-   Time is required.
-   Location is required.
-   Capacity must be a positive number.

### Participant

-   Name is required.
-   Email is required.
-   Email must have a valid format.
-   Prevent duplicate participant email.

### Registration

-   Event is required.
-   Participant is required.
-   Prevent duplicate registration.
-   Prevent registration when capacity is reached.

### Delete

Ask for confirmation before deleting important records.

------------------------------------------------------------------------

## 10. UI Requirements

Create a clean, modern, professional admin dashboard.

### Navigation

Suggested navigation:

``` text
Dashboard
Events
Participants
Registrations
Attendance
Logout
```

### Design Principles

-   Clear visual hierarchy
-   Strong typography
-   Consistent spacing
-   Consistent buttons
-   Simple cards
-   Responsive tables
-   Useful empty states
-   Clear validation messages
-   Clear success/error feedback
-   Mobile-friendly layout

Avoid:

-   Excessive gradients
-   Excessive glassmorphism
-   Decorative effects without purpose
-   Excessive colours
-   Fake dashboard statistics
-   Unnecessary animations

Interactions should have a clear purpose.

------------------------------------------------------------------------

## 10A. Local Preview & Verification

Before deployment, the application must be runnable locally for preview and testing.

Preferred workflow:

```text
BUILD
  ↓
RUN LOCALLY
  ↓
PREVIEW
  ↓
TEST
  ↓
FIX
  ↓
VERIFY
```

Use the project's existing development setup. First inspect `package.json` and identify the correct framework and start command. Install dependencies only when required, then start the development server and report the exact localhost URL.

If the Codex interface provides a **Preview** option, use it first. If Preview is unavailable, use the local development server and open the localhost URL manually.

The local preview should be used to verify the main user flows before GitHub Pages deployment.

## 11. Technical Constraints

### Required

-   Frontend only
-   Use the existing project stack where practical
-   Use `localStorage`
-   Responsive design
-   Component-based structure where appropriate
-   Must be deployable as a static site
-   GitHub Pages is the preferred deployment target for the workshop
-   Production build must complete successfully before deployment
-   Asset paths must work correctly from a GitHub Pages project URL
-   If client-side routing is used, configure it so deployed navigation does not break

### Deployment

The MVP should support this deployment flow:

``` text
LOCAL PROJECT
     ↓
PRODUCTION BUILD
     ↓
GITHUB REPOSITORY
     ↓
GITHUB PAGES
     ↓
PUBLIC DEMO URL
```

Deployment requirements:

1. Push the project source code to a GitHub repository.
2. Build the application for production.
3. Configure GitHub Pages to publish the production build.
4. Verify the deployed URL.
5. Test login, CRUD, registration, attendance, localStorage persistence, navigation, and responsive layout on the deployed site.

For Vite-based projects, configure the production base path correctly when deploying as a GitHub Pages project site.

### Do Not Use

-   Supabase
-   Firebase
-   Backend server
-   External database
-   External API
-   OAuth
-   Payment gateway
-   Email service

The goal is a self-contained prototype that can run locally.

------------------------------------------------------------------------

## 12. Suggested Project Structure

``` text
event-management/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── data/
│   ├── utils/
│   └── App.*
│
├── PRD.md
├── AGENTS.md
├── DESIGN.md
└── README.md
```

The exact structure may follow the existing project architecture if the
project is being modified rather than created from scratch.

------------------------------------------------------------------------

## 13. Acceptance Criteria

The project is considered complete when:

### Authentication

-   [ ] Login works with the demo account.
-   [ ] Logout works.
-   [ ] Login state persists during the session.

### Events

-   [ ] User can create an event.
-   [ ] User can view events.
-   [ ] User can edit an event.
-   [ ] User can delete an event.
-   [ ] Search works.
-   [ ] Status filter works.
-   [ ] Date sorting works.

### Participants

-   [ ] User can create a participant.
-   [ ] User can edit a participant.
-   [ ] User can delete a participant.
-   [ ] Search works.
-   [ ] Duplicate email is prevented.

### Registration

-   [ ] Participant can be registered to an event.
-   [ ] Duplicate registration is prevented.
-   [ ] Event capacity is enforced.

### Attendance

-   [ ] Registered participants appear in attendance.
-   [ ] User can mark Present or Absent.
-   [ ] Attendance totals are correct.
-   [ ] Attendance percentage is correct.

### Persistence

-   [ ] Data remains after browser refresh.
-   [ ] Seed data appears on first launch.

### UI

-   [ ] Desktop layout works.
-   [ ] Mobile layout works.
-   [ ] Navigation works.
-   [ ] Forms provide useful validation messages.
-   [ ] Delete actions require confirmation.

### Deployment

-   [ ] Production build completes successfully.
-   [ ] Project is available from a GitHub Pages URL.
-   [ ] Static assets load correctly after deployment.
-   [ ] Main navigation works on the deployed site.
-   [ ] Login works on the deployed site.
-   [ ] CRUD features work on the deployed site.
-   [ ] `localStorage` data persists on the deployed site.
-   [ ] Mobile layout works on the deployed site.

------------------------------------------------------------------------

## 14. Verification Checklist

Before shipping the prototype:

1.  Does login work?
2.  Does the dashboard show correct statistics?
3.  Does event CRUD work?
4.  Does participant CRUD work?
5.  Does registration work?
6.  Does duplicate registration get blocked?
7.  Does event capacity get enforced?
8.  Does attendance work?
9.  Are calculations correct?
10. Does data survive a browser refresh?
11. Do buttons and navigation work?
12. Does the application work on mobile?
13. Does the production build complete without errors?
14. Does the GitHub Pages deployment load correctly?
15. Do asset paths, navigation, and localStorage work after deployment?

Follow the loop:

``` text
BUILD → VERIFY → FIX → VERIFY AGAIN
```

------------------------------------------------------------------------

## 15. Out of Scope

The following are intentionally excluded from the MVP:

-   Real user authentication
-   Cloud database
-   Supabase
-   Firebase
-   Payment processing
-   Email notifications
-   SMS notifications
-   QR code scanning
-   Real-time collaboration
-   Google Calendar integration
-   Advanced reporting
-   Multi-organisation access control
-   Custom backend hosting

These features can be considered future enhancements after the core
prototype is working.

------------------------------------------------------------------------

## 16. Future Enhancements

Possible future versions:

-   QR attendance
-   Export CSV
-   Printable attendance report
-   Event certificate generation
-   Real authentication
-   Cloud database
-   Email notifications
-   Public event registration page
-   Role-based access
-   Analytics dashboard
-   Custom domain configuration

These should only be added after the MVP is stable.

------------------------------------------------------------------------

## 17. Vibe Coding Workshop Principle

The project should reinforce the following workflow:

``` text
IDEA
  ↓
BRIEF
  ↓
CONTEXT
  ↓
DESIGN SYSTEM
  ↓
BUILD
  ↓
VERIFY
  ↓
FIX
  ↓
REFINE
  ↓
SHIP
```

The participant's role is to define the problem, describe the desired
result, provide context, review the output, test it, and request
improvements.

The AI coding tool handles implementation and iteration.

The human remains responsible for decisions, judgement, testing, and
deciding when the prototype is ready to ship.
