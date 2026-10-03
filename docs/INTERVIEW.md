# TaskFlow interview walkthrough

## Problem statement
We needed a lightweight collaborative task manager for small teams, with authentication, workspaces, task tracking, and comments. The app had to feel fast, be easy to deploy, and work reliably in a server-rendered Next.js environment with MongoDB.

## Architecture summary
The app uses Next.js App Router for the front end and server-side data access. Authentication is enforced server-side via NextAuth credentials and a MongoDB-backed user model. The dashboard and task pages read workspace and task data from MongoDB, and auth is required before accessing protected routes.

## Features to show
1. Authentication flow: sign up, log in, session handling, logout.
2. Dashboard and workspace creation: create workspaces, summary stats, quick task creation.
3. Task board and detail page: filtering, sorting, comments, status updates, assignee management.

## Challenges
- Making Auth.js and MongoDB work reliably in both local and production environments.
- Handling object IDs cleanly between Mongoose documents and form submission.
- Ensuring the task detail page and board remain stable as the workspace membership grows.

## What I would improve next
- Add real-time updates or optimistic UI for comments and status changes.
- Add role-based permissions for workspace owners and members.
- Move more analytics into an API layer and cache office-hour heavy queries.
- Add end-to-end tests for full user journeys and deployment smoke checks.
