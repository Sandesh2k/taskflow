
# TaskFlow Design Specification

## Project Overview
TaskFlow is a collaborative team task management application with a clean, modern interface. It features workspace-based organization, kanban-style task boards, real-time analytics, and dark mode support.

## Design System

### Color Palette
**Primary Colors:**
- Sky Blue (Primary): `#0ea5e9` (sky-500), `#0284c7` (sky-600)
- Slate (Neutral): `#0f172a` (slate-900), `#64748b` (slate-500), `#e2e8f0` (slate-200)

**Status Colors:**
- To Do: Slate gray (`bg-slate-100 text-slate-700`)
- In Progress: Amber (`bg-amber-100 text-amber-800`)
- Done: Emerald (`bg-emerald-100 text-emerald-800`)

**Priority Colors:**
- Low: Neutral gray
- Medium: Sky blue
- High: Red/rose tones

**Dark Mode:**
- Background: `#020817` (dark slate)
- Card backgrounds: `#0f172a`
- Text: `#e2e8f0` (light slate)
- Borders: Semi-transparent slate

### Typography
**Font Family:** Geist Sans (primary), Geist Mono (code/technical)
**Font Sizes:**
- Headings: 2xl (24px), lg (18px), base (16px)
- Body: sm (14px), xs (12px)
- Labels: uppercase tracking-[0.12em] to [0.18em]

**Font Weights:**
- Bold: 700 (headings, emphasis)
- Semibold: 600 (buttons, labels)
- Medium: 500 (secondary text)
- Regular: 400 (body text)

### Spacing & Layout
**Border Radius:**
- Cards/Sections: `rounded-2xl` (16px)
- Inputs/Buttons: `rounded-xl` (12px)
- Badges/Tags: `rounded-full` (pill shape)

**Shadows:** Subtle `shadow-sm` for depth
**Padding:** 4-5 units (16-20px) for card interiors

## Component Specifications

### 1. Authentication Form (AuthForm)
**Location:** [/login](cci:9://file:///home/sandesh.kandalkar/Downloads/Frontend/final-proj/task-flow/app/login:0:0-0:0), [/signup](cci:9://file:///home/sandesh.kandalkar/Downloads/Frontend/final-proj/task-flow/app/signup:0:0-0:0)

**Layout:**
- Centered card on full-screen background
- Max-width: 448px (max-w-md)
- Vertical spacing between elements

**Elements:**
- Heading: "Welcome back" (login) or "Create your account" (signup)
- Subheading: Contextual description text
- Input fields (signup includes name field):
  - Full name (signup only)
  - Email
  - Password (min 8 chars)
- Error message banner (red background, red text)
- Submit button: Full-width, slate-900 background
- Link to toggle between login/signup

**States:**
- Default: Clean form
- Loading: Button shows "Signing in..." / "Creating account..." with disabled state
- Error: Red error banner appears above button

### 2. Dashboard Page
**Location:** [/dashboard](cci:9://file:///home/sandesh.kandalkar/Downloads/Frontend/final-proj/task-flow/app/dashboard:0:0-0:0)

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Header (Welcome + Actions)          │
├─────────────────────────────────────┤
│ Task Statistics Panel (3 cards)      │
├─────────────────────────────────────┤
│ Left Column      │ Right Column     │
│ - Create         │ - Quick Task     │
│   Workspace      │ - Recent Tasks   │
│ - Workspace List │                  │
└─────────────────────────────────────┘
```

**Header Section:**
- Brand label: "TaskFlow" (uppercase, sky-700, tracking)
- Greeting: "Welcome back, {name}"
- Action buttons: View tasks, Edit profile, Logout

**Task Statistics Panel:**
- 3 status cards (To do, In progress, Done) in horizontal grid
- 2 summary cards (Total tasks, Due this week)
- Top assignees list with task counts

**Create Workspace Form:**
- Workspace name input
- Description textarea (3 rows)
- Member emails input (comma-separated)
- Submit button: Full-width, slate-900

**Workspace List:**
- Card per workspace with:
  - Name + slug
  - Member count badge (sky-100)
  - Delete button (owner only, red)
  - Description (if present)

**Quick Task Form:**
- Workspace dropdown
- Task title input
- Details textarea
- Due date picker
- Status + Priority dropdowns (side-by-side)
- Submit button: sky-600

**Recent Tasks List:**
- Task cards showing:
  - Title + status badge
  - Workspace, priority, assignee badges
  - Due date indicator (colored)
  - Description preview

### 3. Tasks Board Page
**Location:** [/tasks](cci:9://file:///home/sandesh.kandalkar/Downloads/Frontend/final-proj/task-flow/app/tasks:0:0-0:0)

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Header (Board & task filters)        │
├─────────────────────────────────────┤
│ Task Creation Form                   │
├─────────────────────────────────────┤
│ Filter & Sort Section                │
├─────────────────────────────────────┤
│ Role Indicator Banner                │
├─────────────────────────────────────┤
│ Kanban Board (3 columns)             │
│ - To do | In progress | Done         │
└─────────────────────────────────────┘
```

**Task Creation Form:**
- Workspace dropdown (dynamic member filtering)
- Assignee dropdown (updates based on workspace)
- Title input
- Description textarea (4 rows)
- Tags input
- Due date picker
- Status + Priority dropdowns
- Submit button: sky-600

**Filter Section:**
- Search input (full-text search)
- Status dropdown (All, To do, In progress, Done)
- Assignee dropdown (All, Unassigned, + members)
- Tag dropdown
- Sort dropdown (Newest, Oldest, Priority, Title)
- Clear filters link

**Kanban Board:**
- 3 columns: To do, In progress, Done
- Each column shows task count badge
- Task cards with:
  - Title (link to detail)
  - Priority badge (uppercase, small)
  - Assignee name
  - Workspace name
  - Due date indicator (colored based on urgency)
  - Tags (sky-100 badges)
  - Delete button (admin only)
- Drag-and-drop support for status changes
- Empty state: "No tasks here."

**Role Indicator:**
- Sky background for admin/owner: "👑 Owner/Admin view: You can see all tasks"
- Amber background for member: "👤 Member view: You can only see tasks assigned to you or created by you"

### 4. Task Detail Page
**Location:** `/tasks/[id]`

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Header (Task title + navigation)     │
├───────────────────┬─────────────────┤
│ Main Content      │ Sidebar          │
│ - Task metadata   │ - Edit form      │
│ - Description     │ - Delete button  │
│ - Tags            │                  │
│ - Comments        │                  │
└───────────────────┴─────────────────┘
```

**Main Content:**
- Metadata badges: Workspace, Priority, Status, Due date
- Description (markdown rendered)
- Tags display (sky-100 badges)
- Comments section:
  - Comment cards with author, timestamp, message
  - Delete button (admin only)
  - Comment form with textarea

**Sidebar (Edit Form):**
- For admin/owner: Full edit capabilities
  - Title, Description, Tags, Due date
  - Assignee dropdown (workspace members only)
  - Status, Priority dropdowns
  - Save changes button
- For members: Status change only
- Delete task button (admin only, red)

### 5. Profile Page
**Location:** [/profile](cci:9://file:///home/sandesh.kandalkar/Downloads/Frontend/final-proj/task-flow/app/profile:0:0-0:0)

**Layout:**
- Simple form with user info display
- Editable fields (name, email)
- Save button

## Interactive Elements

### Buttons
**Primary Action:** sky-600 background, white text, hover: sky-500
**Secondary Action:** white background, slate-700 text, border, hover: slate-50
**Destructive:** rose-50 background, rose-700 text, border, hover: rose-100
**Dark Mode:** Slate-800 background, slate-100 text

### Form Inputs
**Default:** slate-50 background, slate-300 border, slate-900 text
**Focus:** sky-400 border, white background
**Dark Mode:** slate-900 background, slate-100 text

### Dropdowns/Selects
Same styling as inputs with chevron indicator

### Badges/Tags
**Status:** Colored backgrounds with matching text
**Priority:** Uppercase, small font, tracking
**Tags:** sky-100 background, sky-700 text, rounded-full

## Responsive Behavior

**Mobile (< 640px):**
- Single column layout
- Stacked grids
- Full-width inputs/buttons
- Reduced padding

**Tablet (640px - 1024px):**
- 2-column grids
- Side-by-side form fields
- Compact task cards

**Desktop (> 1024px):**
- 3-column kanban board
- Full dashboard layout
- Optimal spacing

## Dark Mode

**Toggle:** Fixed position (top-right), pill-shaped button with emoji + text

**Theme Switching:**
- Smooth transitions (200ms)
- Background: slate-100 → slate-950
- Cards: white → slate-900
- Text: slate-900 → slate-100
- Borders: Semi-transparent in dark mode
- Inputs: slate-900 background with slate-100 text

## Accessibility Features

- Skip to content link (sr-only, focus-visible)
- ARIA labels on interactive elements
- Focus rings (sky-500, 2px)
- Keyboard navigation support
- Semantic HTML structure
- Color contrast compliance

## Animations & Transitions

- Hover states: Background color transitions
- Focus states: Ring offset effects
- Loading states: Skeleton screens or spinner text
- Drag-and-drop: Visual feedback during drag

## Iconography

- Theme toggle: ☀️ (light) / 🌙 (dark)
- Role indicators: 👑 (admin) / 👤 (member)
- No external icon library currently used

## Data Visualization

**Statistics Panel:**
- Large numbers (3xl font) for counts
- Color-coded status cards
- Horizontal bar layout for assignees

**Task Board:**
- Color-coded status badges
- Due date urgency indicators (red for overdue, amber for soon)
- Priority visual hierarchy

## Empty States

- Dashed border cards
- Centered text
- Light gray background (slate-50)
- Contextual messaging

## Error States

- Red background banners (rose-50)
- Red text (rose-700)
- Red borders (rose-200)
- Clear error messaging

## Success States

- Green badges (emerald-100)
- Green text (emerald-800)
- Confirmation messages

## Page Transitions

- Smooth scroll behavior
- Prefetching on Link components
- Loading boundaries with Suspense

## Custom Components

### TaskForm (Client Component)
- Dynamic workspace selection
- Real-time member dropdown updates
- Form validation

### TaskBoard (Client Component)
- Drag-and-drop kanban
- Optimistic updates
- Status change animations

### TaskStatsPanel (Client Component)
- Dynamic statistics display
- Link to full board
- Responsive grid layout

### ThemeToggle (Client Component)
- Local storage persistence
- System preference detection
- Smooth theme switching

## Brand Identity

**Name:** TaskFlow
**Logo/Mark:** Text-based with uppercase tracking
**Primary Color:** Sky blue (#0ea5e9)
**Secondary Color:** Slate gray
**Tone:** Professional, clean, collaborative
**Vibe:** Modern, efficient, team-focused

## Notes for AI Generation

- Maintain rounded corners (2xl for cards, xl for inputs)
- Use subtle shadows (shadow-sm only)
- Keep spacing consistent (4-5 units)
- Preserve color hierarchy (sky for primary, slate for neutral)
- Ensure dark mode compatibility for all components
- Focus on clean, uncluttered layouts
- Use uppercase tracking for labels and badges
- Maintain responsive behavior across breakpoints
