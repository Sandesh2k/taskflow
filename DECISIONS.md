# Design decisions and trade-offs

## Why this stack
- Next.js App Router gave us server actions, route handlers, route-level loading, and straightforward auth integration.
- MongoDB Atlas was the fastest fit for a lightweight team task app with flexible task comments, assignees, and tags.
- NextAuth credentials provider kept the app simple without introducing a third-party identity platform under time pressure.

## Trade-offs we accepted
- We kept the app server-rendered and database-driven instead of adding a separate API layer and Redis cache.
- We prioritized fast iteration and correctness over a broader multi-tenant RBAC implementation.
- The initial phase uses direct database queries with targeted aggregation rather than a fully abstracted repository layer.

## What we would do differently with more time
- Add a dedicated analytics service and a first-class caching layer for heavy dashboard queries.
- Add stronger workspace permission rules and audit history for task changes.
- Introduce a more extensive end-to-end test setup with Playwright and seeded Mongo data.
- Break the dashboard into reusable server/client components and centralize shared validation logic.
