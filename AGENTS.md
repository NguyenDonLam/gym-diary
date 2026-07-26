# Backend Architecture Rules

Apply these rules consistently to every backend module unless the user explicitly instructs otherwise.

## CQRS and use cases

1. Use CQRS with command handlers and query handlers.
2. Give every application use case its own dedicated handler.
3. Each handler must accept either a command for state-changing work or a query for read-only work.
4. Controllers must dispatch commands and queries through NestJS `CommandBus` and `QueryBus`; they must not call services, repositories, or handlers directly.
5. Do not inject or call handlers directly from other handlers. Use `CommandBus`, `QueryBus`, shared services, or domain events as appropriate.
6. Handlers orchestrate individual use cases and may call services, repositories, domain objects, external ports, and other required abstractions.
7. Extract shared or reused logic into services. Services support handlers and must not replace use-case handlers.
8. Every NestJS domain module must register its own command and query handlers in its `providers` array.

## Domain-driven module structure

Organize backend code by domain module or bounded context first:

```text
modules/
`-- <module-name>/
    |-- domain/
    |-- application/
    |-- infrastructure/
    |-- presentation/
    `-- <module-name>.module.ts
```

### Domain

The `domain` layer contains entities, aggregates, value objects, domain services, domain events, business rules, and repository interfaces.

It must not depend on NestJS controllers or modules, HTTP DTOs, ORMs, database implementations, external API implementations, or other infrastructure-specific code.

### Application

The `application` layer contains commands, queries, command handlers, query handlers, application services, use-case orchestration, and ports/interfaces required by use cases.

It may depend on the domain layer, but must not depend directly on infrastructure implementations.

### Infrastructure

The `infrastructure` layer contains ORM entities, repository implementations, database configuration, external API clients, email/storage/messaging adapters, and persistence/domain mappers.

Infrastructure implementations must implement interfaces defined by the domain or application layers.

### Presentation/API

The `presentation` layer contains controllers, request/response DTOs, guards, interceptors, presenters, and other transport-specific code.

Controllers are limited to receiving and validating requests, converting them into commands or queries, dispatching through `CommandBus` or `QueryBus`, and returning results.

## Dependency direction

Dependencies must point inward:

```text
Presentation/API
      |
      v
Application
      |
      v
Domain

Infrastructure
      |
      v
Domain/Application interfaces
```
