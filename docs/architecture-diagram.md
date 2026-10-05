# Architecture diagram

```mermaid
flowchart TB
    %% Client layer
    subgraph Client[Client layer]
        User[User / Browser]
        UI[TaskFlow UI\nDashboard, Tasks, Login, Signup]
        Theme[Theme state / Client interactions]
    end

    %% Application layer
    subgraph App[Next.js application layer]
        Vercel[Vercel deployment\nNext.js runtime]
        Pages[App Router pages\nServer components]
        Actions[Server actions / Route handlers\ncreate task, update status, delete task]
        Auth[NextAuth credentials auth\nJWT session + server-side guards]
    end

    %% Data + analytics layer
    subgraph Data[Data & analytics]
        DB[(MongoDB\nUsers, Workspaces, Tasks, Comments)]
        Agg[Aggregation pipeline\nstatus counts, due this week, assignee summary]
        Cache[Request cache / App Router cache]
    end

    User --> UI
    UI --> Pages
    UI --> Auth
    UI --> Actions
    Theme --> UI

    Pages --> Auth
    Pages --> Actions
    Actions --> DB
    Pages --> Cache
    Actions --> Cache

    Auth --> DB
    Auth --> Pages

    Pages --> Agg
    Agg --> DB
    Actions --> DB
    DB --> Pages

    classDef user fill:#dbeafe,stroke:#1d4ed8,stroke-width:1.5px,color:#0f172a;
    classDef app fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef data fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#0f172a;
    classDef cache fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#0f172a;

    class User,UI,Theme user;
    class Vercel,Pages,Actions,Auth app;
    class DB,Agg data;
    class Cache cache;
```

## Notes
- The browser loads the TaskFlow UI and sends requests to the Next.js app hosted on Vercel.
- Authentication is enforced through NextAuth credentials login and server-side checks before protected pages render.
- MongoDB is the system of record for users, workspaces, tasks, comments, and filtered task metadata.
- Aggregated dashboard information such as status counts, due-date summaries, and top assignees runs through MongoDB aggregation for efficient reporting.
- Request caching and App Router caching reduce repeated work while preserving fresh task and workspace data after mutations.
