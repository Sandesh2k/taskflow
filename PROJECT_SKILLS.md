# TaskFlow - Project Skills Documentation

## Project Overview

TaskFlow is a collaborative task management application built with Next.js 16 (App Router), React 19, TypeScript, and MongoDB. It features role-based access control (RBAC), drag-and-drop task management, real-time task status updates, and workspace-based team collaboration.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: NextAuth v5 with bcryptjs
- **Validation**: Zod
- **Drag & Drop**: @dnd-kit
- **Markdown**: marked

## Directory Structure

```
task-flow/
├── app/
│   ├── auth/
│   │   └── login/page.tsx          # Login page
│   ├── dashboard/page.tsx           # Dashboard with workspaces and quick task creation
│   ├── tasks/
│   │   ├── page.tsx                 # Main task board with filters and drag-and-drop
│   │   └── [id]/page.tsx            # Task detail page with comments and editing
│   ├── profile/page.tsx             # User profile management
│   └── layout.tsx                   # Root layout with auth provider
├── components/
│   ├── auth/
│   │   └── LogoutButton.tsx         # Logout button component
│   ├── TaskBoard.tsx                # Drag-and-drop task board (client component)
│   └── TaskStatsPanel.tsx           # Task statistics panel
├── lib/
│   ├── auth.ts                      # NextAuth configuration
│   ├── db.ts                        # MongoDB connection
│   ├── task-actions.ts              # Server actions for task CRUD operations
│   ├── task-stats.ts                # Server-side task statistics (uses Mongoose)
│   ├── task-utils.ts                # Client-safe task utilities (date formatting, etc.)
│   └── workspace-permissions.ts     # RBAC permission helpers
├── models/
│   ├── Task.ts                      # Task model with comments, assignee, workspace
│   ├── User.ts                      # User model with authentication
│   └── Workspace.ts                 # Workspace model with members and roles
└── TESTING_GUIDE.md                 # Testing guide for RBAC features
```

## Database Models

### User Model (`models/User.ts`)
- Fields: name, email, password (hashed), createdAt, updatedAt
- Used for authentication and task assignment

### Workspace Model (`models/Workspace.ts`)
- Fields: name, slug (unique), description, owner (ObjectId), members (array)
- Members array contains: userId (ObjectId), role ("owner" | "admin" | "member")
- Roles: owner (creator), admin (full access), member (limited access)

### Task Model (`models/Task.ts`)
- Fields: title, description, status, priority, tags, dueDate, workspace (ObjectId), assignee (ObjectId), createdBy (ObjectId), comments (array)
- Comments array contains: user (ObjectId), message, createdAt
- Status values: "todo", "in_progress", "done"
- Priority values: "low", "medium", "high"

## Key Components

### TaskBoard (`components/TaskBoard.tsx`)
- **Purpose**: Drag-and-drop task board with three columns (todo, in_progress, done)
- **Props**: `tasks` (array), `canEdit` (boolean), `onDelete` (optional function)
- **Features**: 
  - Drag and drop using @dnd-kit
  - Optimistic UI updates
  - Status change via drag or dropdown
  - Due date status indicators
- **Important**: Client component - requires plain objects, not Mongoose documents

### Task Stats Panel (`components/TaskStatsPanel.tsx`)
- **Purpose**: Display task statistics (todo, in_progress, done counts)
- **Important**: Server component - uses Mongoose directly

## Server Actions (`lib/task-actions.ts`)

### createTaskAction
- Creates a new task with validation
- **RBAC**: Only admin/owner can assign tasks to others; members can only assign to themselves
- Validates: title, description, status, priority, tags, dueDate, workspaceId, assignee

### updateTaskAction
- Updates an existing task
- **RBAC**: 
  - Admin/owner: Can update all fields
  - Member: Can only update status field
- Compares current task with incoming data to detect unauthorized changes

### updateTaskStatusAction / updateTaskStatusById
- Updates task status only
- Used for drag-and-drop operations
- **RBAC**: All authenticated users can update status

### deleteTaskAction
- Deletes a task
- **RBAC**: Only admin/owner can delete tasks

### addTaskCommentAction
- Adds a comment to a task
- **RBAC**: All authenticated users can add comments

### deleteTaskCommentAction
- Deletes a comment from a task
- **RBAC**: Only admin/owner can delete comments

## Permission System (`lib/workspace-permissions.ts`)

### getUserRoleInWorkspace(userId, workspaceId)
- Returns user's role in a workspace: "owner", "admin", or "member"
- Returns null if user is not in workspace

### canUserAssignTasks(userId, workspaceId)
- Returns true if user is owner or admin
- Used to control task assignment and editing permissions

### canUserViewAllTasks(userId, workspaceId)
- Returns true if user is owner or admin
- Used to control task visibility

### canUserViewTask(userId, taskId)
- Returns true if user can view the specific task
- Logic: Admin/owner can view all tasks; members can only view tasks assigned to them or created by them

## Client-Side Utilities (`lib/task-utils.ts`)

### getDueDateStatus(dueDate, status, updatedAt)
- Returns color and text for due date status
- Green: Task completed before due date
- Red: Task overdue and not done
- Amber: Due date approaching (within 3 days)
- No indicator: No due date or task done

### formatDate(date)
- Formats date as YYYY-MM-DD to prevent hydration errors
- Ensures consistent server/client rendering

## Server-Side Utilities (`lib/task-stats.ts`)

### getTaskStatsForUser(userId)
- Returns task statistics for a user
- **Important**: Uses Mongoose - cannot be used in client components

## Important Patterns

### 1. Data Conversion for Client Components
Mongoose documents cannot be passed to client components. Always convert to plain objects:

```typescript
const plainTasks = tasks.map((task) => ({
  ...task,
  _id: String(task._id),
  createdBy: task.createdBy ? String(task.createdBy) : task.createdBy,
  workspace: task.workspace ? {
    ...task.workspace,
    _id: typeof task.workspace._id === 'object' ? String(task.workspace._id) : task.workspace._id,
  } : task.workspace,
  assignee: task.assignee ? {
    ...task.assignee,
    _id: typeof task.assignee._id === 'object' ? String(task.assignee._id) : task.assignee._id,
  } : task.assignee,
  comments: Array.isArray(task.comments) ? task.comments.map((comment: any) => ({
    ...comment,
    _id: comment._id ? String(comment._id) : comment._id,
    user: comment.user ? String(comment.user) : comment.user,
  })) : [],
}));
```

### 2. Role-Based Task Filtering
Members should only see their assigned/created tasks:

```typescript
const baseQuery: Record<string, unknown> = { workspace: { $in: workspaceIds } };

const canViewAll = await Promise.all(
  workspaceIds.map((id) => canUserAssignTasks(session.user.id, String(id)))
);
const hasAdminAccess = canViewAll.some((v) => v);

if (!hasAdminAccess) {
  baseQuery.$or = [
    { assignee: new mongoose.Types.ObjectId(session.user.id) },
    { createdBy: new mongoose.Types.ObjectId(session.user.id) },
  ];
}
```

### 3. Workspace-Specific Member Lists
Each workspace should show only its own members:

```typescript
const workspaceMemberMap = new Map<string, Array<{ id: string; name: string }>>();

for (const workspace of workspaces) {
  const workspaceId = String(workspace._id);
  const workspaceMemberOptions: Array<{ id: string; name: string }> = [];
  const workspaceUserIds: string[] = [];
  const workspaceSeenIds = new Set<string>();

  // Add members and owner with deduplication
  for (const member of workspace.members ?? []) {
    const userId = member.userId ? String(member.userId) : "";
    if (userId && !workspaceSeenIds.has(userId)) {
      workspaceSeenIds.add(userId);
      workspaceUserIds.push(userId);
    }
  }

  // Fetch user names and build options
  const users = workspaceUserIds.length > 0
    ? await User.find({ _id: { $in: workspaceUserIds } }).select("_id name").lean()
    : [];

  const userMap = new Map(users.map((u) => [String(u._id), u.name || "Unknown"]));

  for (const userId of workspaceUserIds) {
    workspaceMemberOptions.push({ id: userId, name: userMap.get(userId) || "Unknown" });
  }

  workspaceMemberMap.set(workspaceId, workspaceMemberOptions);
}
```

### 4. Hydration Error Prevention
Use `suppressHydrationWarning` on components with dynamic attributes (like @dnd-kit):

```typescript
<div suppressHydrationWarning>
  {/* Content with dynamic attributes */}
</div>
```

### 5. Unique Slug Generation
Prevent duplicate workspace slugs:

```typescript
let slug = name
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 50) || "workspace";

let slugExists = await Workspace.findOne({ slug });
let attempts = 0;
while (slugExists && attempts < 10) {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  slug = `${slug}-${randomSuffix}`;
  slugExists = await Workspace.findOne({ slug });
  attempts++;
}
```

## RBAC Summary

### Owner
- Can create, edit, delete workspaces
- Can see all tasks in workspace
- Can assign tasks to anyone
- Can edit all task fields
- Can delete tasks
- Can delete comments
- Can use drag-and-drop

### Admin
- Can see all tasks in workspace
- Can assign tasks to anyone
- Can edit all task fields
- Can delete tasks
- Can delete comments
- Can use drag-and-drop
- Cannot delete workspace

### Member
- Can only see tasks assigned to them or created by them
- Can only assign tasks to themselves
- Can only edit task status (not title, description, assignee, etc.)
- Cannot delete tasks
- Cannot delete comments
- Can use drag-and-drop to change status
- Cannot delete workspace

## Authentication Flow

1. User registers via `/profile` page
2. Password is hashed with bcryptjs
3. User logs in via `/auth/login` page
4. NextAuth creates session with user ID
5. Server actions check `getSafeSession()` for authentication
6. Protected pages redirect to `/login` if not authenticated

## Common Issues and Solutions

### 1. "Module not found: Can't resolve 'async_hooks'"
- **Cause**: Importing Mongoose in client component
- **Solution**: Move Mongoose-dependent code to server components or separate server-only utilities

### 2. "Only plain objects can be passed to Client Components"
- **Cause**: Passing Mongoose documents to client components
- **Solution**: Convert to plain objects with stringified ObjectIds

### 3. Hydration errors
- **Cause**: Date formatting differences between server and client
- **Solution**: Use consistent date format (YYYY-MM-DD) and `suppressHydrationWarning`

### 4. Duplicate key error on workspace slug
- **Cause**: Non-unique slugs
- **Solution**: Add random suffix to duplicate slugs

## Testing

See `TESTING_GUIDE.md` for detailed testing instructions for RBAC features.

## Environment Variables

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `AUTH_SECRET`: NextAuth secret
- `NEXTAUTH_SECRET`: NextAuth secret (alternative)

## Development Notes

- Next.js 16 has breaking changes from previous versions - check `node_modules/next/dist/docs/` for latest API documentation
- Server actions use `"use server"` directive
- Client components should be in `components/` directory
- Server components can be in `app/` directory
- Use `revalidatePath` after mutations to update cache
- Use `redirect` for navigation after form submissions
