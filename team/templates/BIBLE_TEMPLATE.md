# PROJECT CERBER - Master Map

**Project:** [Project Name]  
**Owner:** Stefan Pitek  
**Last Updated:** YYYY-MM-DD

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (React/Next.js)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         API Layer (Express)             │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    Module A  Module B  Module C
```

## Modules Index

### Core Modules

1. **module-a** - Purpose
   - Owner: Name
   - Status: Active
   - Files: `src/modules/module-a/`

2. **module-b** - Purpose
   - Owner: Name
   - Status: Active
   - Files: `src/modules/module-b/`

## Connections Map

- `module-a` → `module-b`: processData()
- `module-b` → `module-c`: validateInput()

## Team Responsibilities

- **Developer A**: module-a, module-d
- **Developer B**: module-b, module-c

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Redis
- Testing: Jest, Supertest
