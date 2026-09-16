# DESIGN.md

## Design Direction

Create a clean, modern and professional Event Management System.

The application is a workshop prototype, but it should feel like a credible real-world admin dashboard.

## Brand Mood

- Modern
- Professional
- Clean
- Focused
- Practical
- Confident

## Colour

Use a restrained palette.

Primary accent:
- Emerald green

Base:
- Dark charcoal
- Near-black
- White / near-white text

Supporting colours may be used only when they communicate meaning, such as success, warning or error states.

Avoid excessive colours.

## Typography

Use one clean, readable font family.

Hierarchy:

- Large page titles
- Clear section headings
- Medium card titles
- Comfortable body text
- Small supporting labels

Prioritise readability over decorative typography.

## Layout

Use an admin dashboard structure.

Suggested layout:

```text
Sidebar / Navigation
        ↓
Top Header
        ↓
Page Content
        ↓
Cards / Tables / Forms
```

Desktop:
- Spacious
- Clear alignment
- Comfortable content width

Mobile:
- Responsive
- Navigation adapts appropriately
- Tables can become cards or horizontal scrolling where necessary
- Forms become single-column
- Buttons remain easy to tap

## Dashboard

Dashboard cards should show:

- Total Events
- Upcoming Events
- Total Participants
- Total Registrations
- Attendance Rate

Cards should have:

- Clear labels
- Prominent values
- Consistent spacing
- Minimal decoration

Do not create fake statistics.

All statistics should come from application data.

## Navigation

Suggested navigation:

- Dashboard
- Events
- Participants
- Registrations
- Attendance
- Logout

Navigation should make the current page obvious.

## Cards

Use:

- Consistent corner radius
- Subtle borders
- Comfortable internal padding
- Clear hierarchy

Avoid:

- Cards nested inside excessive cards
- Heavy shadows
- Glassmorphism
- Decorative glow effects

## Buttons

Primary actions should use the accent colour.

Examples:

- Add Event
- Add Participant
- Register Participant
- Save
- Login

Secondary actions should have a quieter visual treatment.

Destructive actions such as Delete should be visually clear and require confirmation.

## Forms

Forms should:

- Use clear labels
- Show required fields
- Provide useful validation messages
- Keep related fields grouped
- Avoid unnecessarily long forms

Use sensible input types:

- Date input for dates
- Time input for times
- Number input for capacity
- Email input for email addresses

## Tables

Tables should be:

- Easy to scan
- Consistently aligned
- Responsive
- Action-oriented

Typical actions:

- View
- Edit
- Delete

On smaller screens, adapt the table rather than allowing the entire UI to break.

## Status

Use clear status indicators for:

- Draft
- Upcoming
- Ongoing
- Completed
- Cancelled
- Present
- Absent

Status styling should communicate meaning without relying only on colour.

## Feedback

Provide clear feedback after actions:

- Success
- Error
- Validation
- Empty state
- Confirmation

Examples:

- “Event created successfully.”
- “Registration already exists.”
- “Event capacity has been reached.”

## Icons

Use a consistent icon set.

Icons should communicate meaning.

Avoid:

- Random emoji as UI icons
- Icons on every piece of text
- Decorative icons with no purpose

## Animation

Use subtle animation only when useful.

Good uses:

- Page transitions
- Modal appearance
- Button feedback
- Small hover states

Avoid:

- Excessive motion
- Glowing effects
- Decorative animation
- Animation that slows down the workflow

## Empty States

Empty screens should explain what the user can do next.

Example:

```text
No events yet.

Create your first event to get started.

[ Add Event ]
```

## Error States

Errors should be:

- Clear
- Specific
- Actionable

Avoid technical messages when a simpler explanation is possible.

## Visual Quality Rule

Do not optimise for “AI-looking” design.

Avoid:

- Purple/green gradients
- Random glassmorphism
- Excessive rounded containers
- Gradient text
- Excessive neon effects
- Fake analytics
- Decorative robot/AI graphics
- Too many colours

Prioritise:

- Strong typography
- Clear spacing
- Consistent components
- Meaningful interactions
- Real application states
- Useful information hierarchy

## Responsive Rule

The application must work on:

- Desktop
- Tablet
- Mobile

Always verify the layout at a narrow mobile width before considering the UI complete.

## Design Principle

The interface should communicate:

**Simple enough to understand.  
Professional enough to use.  
Focused enough to finish.**

## Local Preview UX

The application should be easy to preview locally during development.

Preferred workflow:

```text
BUILD → RUN LOCALLY → PREVIEW → TEST → FIX → VERIFY
```

The UI must remain usable when served from a local development URL such as `http://localhost:<port>`. Do not add UI elements solely for local preview.

When the Codex environment provides a **Preview** option, it should be the preferred visual checking method. Manual localhost access is the fallback when Preview is unavailable.

## GitHub Pages / Static Deployment UI Rules

The application must remain compatible with static GitHub Pages hosting.

- Do not depend on server-side rendering or backend routes.
- Use relative or correctly base-aware asset paths.
- Ensure the configured Vite `base` matches the actual GitHub Pages project path.
- Avoid assumptions that the site is hosted at the domain root.
- State-based/client-side navigation should continue to work after deployment.
- Verify the production build visually, not only the development version.
- Check responsive layouts again on the deployed URL.

## Deployment Verification

Before considering the visual design complete, verify:

- Local preview works
- Production build works
- GitHub Pages live site loads
- CSS loads correctly
- JavaScript loads correctly
- Icons/assets load correctly
- Navigation does not break
- Login screen works
- Tables and forms remain responsive
- Empty, validation and error states remain readable

The visual design should look consistent between local development, production build and GitHub Pages deployment.

## Deployment-Friendly UI Rules

The interface must remain visually consistent when deployed under a GitHub Pages project URL.

### Asset Paths

- Use deployment-safe asset paths.
- Avoid hard-coded root paths such as `/assets/...` when they can break under a repository subpath.
- Prefer the existing Vite asset handling and relative/base-aware paths.
- Verify images, icons, fonts and other assets after production build and deployment.

### Routing

- Design navigation so it works correctly on a static GitHub Pages deployment.
- Avoid introducing routing complexity that is unnecessary for the prototype.
- If client-side routing is used, ensure the chosen approach works with the GitHub Pages deployment strategy.

### Responsive Deployment Check

The deployed interface should preserve the same visual hierarchy across:

- Desktop
- Tablet
- Mobile

Check the actual deployed site rather than relying only on the local development server.

### Visual Consistency After Build

Production deployment must not change the intended design language:

- Emerald accent remains consistent.
- Typography hierarchy remains clear.
- Spacing and card proportions remain consistent.
- Tables and forms remain usable.
- No broken images, icons or styles.
- No unexpected horizontal overflow.
- No unstyled or partially loaded components.

### Prototype Limitation

The design may present the application as a professional admin dashboard, but it must not imply that localStorage provides multi-user or production-grade data security.
