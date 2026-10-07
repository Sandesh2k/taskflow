# Role-Based Access Control Testing Guide

## Overview
TaskFlow now supports role-based access control with three roles:
- **Owner**: Can see all tasks, assign tasks to anyone, full control
- **Admin**: Can see all tasks, assign tasks to anyone, full control
- **Member**: Can only see tasks assigned to them or created by them, can only assign to themselves

## Prerequisites
1. Create at least 3 user accounts for testing
2. Create a workspace
3. Add users to the workspace with different roles

## Setup Instructions

### Step 1: Create Test Users
1. Sign up 3 users:
   - `admin@test.com` (will be workspace owner)
   - `member1@test.com` (will be admin)
   - `member2@test.com` (will be regular member)

### Step 2: Create Workspace
1. Login as `admin@test.com`
2. Go to Dashboard
3. Create a new workspace named "Test Workspace"

### Step 3: Add Members to Workspace
**Method 1: Via UI (Recommended)**
1. Login as `admin@test.com`
2. Go to Dashboard
3. In the "Create workspace" form, enter:
   - Name: "Test Workspace"
   - Description: "Testing RBAC"
   - Invite members: `member1@test.com, member2@test.com`
4. Click "Create workspace"
5. Members will be added automatically with "member" role

**Method 2: Via MongoDB (for custom roles)**
If you need to assign specific roles (admin vs member), you can update MongoDB:

```javascript
// Connect to MongoDB and run this script
db.workspaces.updateOne(
  { name: "Test Workspace" },
  {
    $push: {
      members: [
        {
          userId: ObjectId("member1_user_id"),
          role: "admin",
          joinedAt: new Date()
        },
        {
          userId: ObjectId("member2_user_id"),
          role: "member",
          joinedAt: new Date()
        }
      ]
    }
  }
)
```

**To get user IDs:**
```javascript
db.users.find({ email: { $in: ["member1@test.com", "member2@test.com"] } }, { _id: 1, email: 1 })
```

## Test Cases

### Test 1: Admin/Owner Can See All Tasks
**Steps:**
1. Login as `admin@test.com` (owner)
2. Go to Tasks page
3. Create 3 tasks:
   - Task A assigned to `member1@test.com`
   - Task B assigned to `member2@test.com`
   - Task C unassigned
4. Verify all 3 tasks are visible
5. Check the banner shows "👑 Owner view: You can see all tasks"

**Expected Result:** Owner sees all tasks regardless of assignee

### Test 2: Member Can Only See Their Own Tasks
**Steps:**
1. Logout and login as `member2@test.com` (regular member)
2. Go to Tasks page
3. Verify you can only see:
   - Task B (assigned to member2)
   - Any tasks created by member2
4. Verify you CANNOT see Task A (assigned to member1)
5. Check the banner shows "👤 Member view: You can only see tasks assigned to you or created by you"

**Expected Result:** Member only sees tasks assigned to them or created by them

### Test 3: Admin Can See All Tasks
**Steps:**
1. Logout and login as `member1@test.com` (admin)
2. Go to Tasks page
3. Verify you can see all tasks (Task A, B, C)
4. Check the banner shows "👑 Admin view: You can see all tasks"

**Expected Result:** Admin sees all tasks regardless of assignee

### Test 4: Member Cannot Access Other's Task Details
**Steps:**
1. Login as `member2@test.com`
2. Try to directly access a task URL assigned to member1:
   - Navigate to `/tasks/[task_id_of_task_a]`
3. Verify you get a 404 Not Found page

**Expected Result:** Member cannot view task details of tasks not assigned to them

### Test 5: Admin Can Assign Tasks to Anyone
**Steps:**
1. Login as `admin@test.com`
2. Create a new task
3. In the assignee dropdown, select `member2@test.com`
4. Save the task
5. Verify task is created and assigned to member2

**Expected Result:** Admin can assign tasks to any workspace member

### Test 6: Member Can Only Assign to Themselves
**Steps:**
1. Login as `member2@test.com`
2. Create a new task
3. Try to assign it to `member1@test.com`
4. Save the task
5. Verify you are redirected back to tasks page (assignment rejected)
6. Create another task and assign it to yourself
7. Verify task is created successfully

**Expected Result:** Member can only assign tasks to themselves

### Test 7: Drag and Drop Status Updates (All Roles)
**Steps:**
1. Login as `member2@test.com`
2. Find a task assigned to you
3. Drag it from "To do" to "In progress"
4. Verify task moves and status updates
5. Login as `admin@test.com`
6. Drag any task between columns
7. Verify all tasks can be moved

**Expected Result:** All users can update status of tasks they can see

### Test 8: Due Date Visibility
**Steps:**
1. Login as `admin@test.com`
2. Create a task with a due date in the past
3. Assign it to `member2@test.com`
4. Login as `member2@test.com`
5. Verify the due date shows in red (overdue)
6. Login as `member1@test.com`
7. Verify you CANNOT see this task (not assigned to you)

**Expected Result:** Due date colors work correctly, but task visibility is still role-based

## Database Verification

After testing, you can verify the data in MongoDB:

```javascript
// Check workspace members and roles
db.workspaces.find({ name: "Test Workspace" }, { members: 1, owner: 1 })

// Check tasks and their assignees
db.tasks.find({ workspace: ObjectId("workspace_id") }, { title: 1, assignee: 1, createdBy: 1 })
```

## Troubleshooting

### Issue: Members can see all tasks
**Solution:** Check that the workspace members have correct roles in MongoDB:
```javascript
db.workspaces.updateOne(
  { name: "Test Workspace" },
  { $set: { "members.$[elem].role": "member" } },
  { arrayFilters: [{ "elem.email": "member2@test.com" }] }
)
```

### Issue: Admin cannot assign tasks
**Solution:** Verify the role is set to "admin" not "member" in the database

### Issue: Tasks not filtering correctly
**Solution:** Check the `workspace-permissions.ts` logic and ensure the MongoDB query is being built correctly

## Summary

The role-based access control ensures:
- ✅ Owners and admins have full visibility and control
- ✅ Members have restricted visibility (only their tasks)
- ✅ Members cannot assign tasks to others
- ✅ Task detail pages are protected by permission checks
- ✅ UI clearly indicates the user's current view level
