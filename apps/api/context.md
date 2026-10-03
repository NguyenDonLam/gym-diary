# 🚨 API CONTEXT — KEEP CURRENT

> **MANDATORY:** Update this file in the same change as every major API change to modules, use cases, persistence, integrations, or algorithms. Describe the latest code, not an older or planned design.

## System-wide

- **Runtime:** NestJS starts AppModule from src/main.ts on PORT, default 3000.
- **Current scope:** Starter API only; no workout backend, database, CQRS package, policies, external adapters, background jobs, or mobile API calls.
- **Future architecture rule:** AGENTS.md requires bounded-context modules directly under src/ with domain, application, infrastructure, and presentation layers.
- **Future request flow:** Controller validates/maps HTTP input → CommandBus or QueryBus → one handler per use case → domain/shared services and inward-facing contracts → infrastructure adapter.
- **Status of that rule:** It applies to future work; the starter code does not yet implement it.

## Module: AppModule

- **Composition:** src/app.module.ts registers AppController and AppService; imports no feature modules.
- **Request path:** GET / → AppController.getHello() → AppService.getHello() → constant "Hello World!".
- **Algorithm/state:** No validation, authorization, persistence, state change, or workout calculation beyond Nest defaults.
- **Current exception:** The starter controller calls a service directly. New use cases must follow the AGENTS.md CQRS rule.
- **Entry points:** src/main.ts, src/app.module.ts, src/app.controller.ts, src/app.service.ts.
- **Checks:** src/app.controller.spec.ts and test/ contain starter tests.
- **When a module is added:** Add its commands/queries, state flow, algorithms, adapters, and edge cases here.
