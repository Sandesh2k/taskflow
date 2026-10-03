# Architecture diagram

```mermaid
flowchart LR
    User[User / Browser] --> Client[Client UI\nNext.js App Router]
    Client --> Auth[Auth enforcement\nNextAuth + session guard]
    Client --> Server[Next.js server components / route handlers]
    Server --> DB[(MongoDB Atlas)]
    Server --> Cache[(Request cache / App Router cache)]

    Auth --> Server
    Server --> Tasks[Task + Workspace queries]
    Tasks --> Stats[Aggregation pipeline\nstatus counts, due this week, top assignees]
    Stats --> DB
    Server --> Cache

    classDef primary fill:#dbeafe,stroke:#2563eb,stroke-width:1px;
    classDef secondary fill:#ecfeff,stroke:#0f172a,stroke-width:1px;
    classDef db fill:#dcfce7,stroke:#16a34a,stroke-width:1px;
    class User,Client,Auth,Server primary;
    class Tasks,Stats,Cache secondary;
    class DB db;
```

## Notes
- The browser talks to the Next.js server for rendering and protected routes.
- Auth is enforced through server-side guards before workspace or task data is loaded.
- MongoDB remains the source of truth for users, workspaces, and tasks.
- Caching is mainly handled at the App Router and request level; expensive analytics queries are reduced with aggregation and targeted lookups.
