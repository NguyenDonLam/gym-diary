# Project Instructions

## Backend architecture: CQRS and Domain-Driven Design

These instructions apply to every backend module and all future backend changes in this repository unless the user explicitly instructs otherwise.

1. Use CQRS with command handlers and query handlers.
2. Give every application use case its own dedicated handler.
3. Each handler must accept either:
   - a command for any operation that creates, updates, deletes, or otherwise modifies state; or
   - a query for a read-only operation.
4. Controllers must not call services or repositories directly. Controllers must dispatch commands and queries through `CommandBus` and `QueryBus`.
5. Handlers may call services, repositories, domain objects, external ports, or other abstractions required to complete the use case.
6. Extract shared logic, especially logic reused by multiple handlers or modules, into services.
7. Services must not replace use-case handlers. Services contain reusable logic; handlers orchestrate individual use cases.
8. Do not inject or call handlers directly from controllers or other handlers. Use `CommandBus`, `QueryBus`, shared services, or domain events as appropriate.
9. Follow Domain-Driven Design with clear separation between domain, application, infrastructure, and presentation/API layers.
10. Organize the backend by domain module or bounded context first. Backend modules must be direct siblings at the existing module level (for example, `server/src/news-categories` must be alongside `server/src/articles`; do not introduce a wrapping `server/src/modules` directory). Each module should use this structure:

```text
server/src/modules/<module-name>/
    |-- domain/
    |-- application/
    |   |-- commands/          # command definitions only
    |   |-- queries/           # query definitions only
    |   |-- handlers/
    |   |   |-- commands/      # command handlers only
    |   |   `-- queries/       # query handlers only
    |   |-- policies/          # authorization policy contracts
    |   `-- ports/
    |-- infrastructure/
    |-- presentation/
    `-- <module-name>.module.ts
```

11. The `domain` layer should contain entities, aggregates, value objects, domain services, domain events, business rules, and repository interfaces.
12. The domain layer must not depend on NestJS controllers or modules, HTTP DTOs, TypeORM or another ORM, database implementations, external API implementations, or any infrastructure-specific code.
13. The `application` layer should contain commands, queries, command handlers, query handlers, application services, use-case orchestration, and ports or interfaces required by use cases. Handler files must live in dedicated handler directories and must not be colocated with command or query definition files. All ports should have the suffix `Port` and all adapters implementing a port should have the suffix `Adapter`.
14. The application layer may depend on the domain layer, but it must not depend directly on infrastructure implementations.
15. The `infrastructure` layer should contain ORM entities, repository implementations, database configuration, external API clients, email/storage/messaging adapters, and persistence/domain mappers.
16. Infrastructure implementations must implement interfaces defined in the domain or application layers.
17. The `presentation` or `api` layer should contain controllers, request and response DTOs, guards, interceptors, presenters, and other transport-specific code.
18. Controllers should only receive and validate requests, convert them into commands or queries, dispatch them through `CommandBus` or `QueryBus`, and return the resulting response.
19. Dependencies must point inward:

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

20. Every NestJS module must register its own handlers in its `providers` array.
21. Apply this CQRS and DDD architecture consistently unless the user explicitly instructs otherwise.
22. Use the policy pattern for backend authorization. Controllers must not contain authorization rules, and handlers should delegate permission decisions to explicit policy abstractions (with infrastructure-specific implementations where required).

When modifying existing backend code, preserve these boundaries and migrate touched use cases toward this structure rather than introducing new architectural exceptions.

## Mobile/frontend architecture: Container and Presentational Components

These instructions apply to every Expo/React Native mobile feature and all future frontend changes in this repository unless the user explicitly instructs otherwise.

23. Preserve the existing mobile/frontend folder structure. Do not reorganize the mobile app into Domain-Driven Design layers unless explicitly requested.

24. Use the Container/Presentational Component pattern for frontend features that interact with workout data, local persistence, backend APIs, synchronization, timers, statistics, or other application state.

25. Apply the container boundary at a meaningful screen, feature section, form, list, chart, active-workout workflow, or dashboard widget level.

Good container examples include:

```text
WorkoutProgramsContainer
EditWorkoutProgramContainer
ActiveWorkoutContainer
ExerciseHistoryContainer
ProgramProgressChartContainer
LifetimeStatsWidgetContainer
```

26. Do not create a container for every visual component.

Avoid unnecessary structures such as:

```text
ActiveWorkoutContainer
    `-- ExerciseList
        `-- ExerciseRowContainer
            `-- ExerciseRow
                `-- SetRowContainer
                    `-- SetRow
```

Use one container per meaningful data-loading, persistence, synchronization, or workflow boundary.

27. Containers are responsible for frontend orchestration concerns, including:

* Calling local database query hooks
* Calling backend query hooks
* Calling mutation hooks
* Coordinating SQLite, Drizzle, backend API, and synchronization operations
* Handling loading states
* Handling error states
* Mapping workout, program, exercise, session, set, and statistics models into form values or view models
* Mapping submitted form values into mutation inputs
* Coordinating query refreshes, cache updates, invalidation, and statistics recalculation
* Reading Expo Router parameters
* Reading and updating search, filter, period, program, exercise, and date-range state
* Coordinating active workout state, rest timers, workout duration, Live Activities, and native integrations
* Coordinating authentication, permissions, connectivity, and available actions when relevant
* Passing prepared data and callbacks into presentational components

28. Presentational components are responsible for rendering and user interaction.

Presentational components should:

* Receive data through props or presentation context
* Render English user-facing text
* Emit user actions through callbacks
* Manage small local UI state
* Remain independent from SQLite, Drizzle queries, HTTP clients, repositories, API DTOs, synchronization implementations, and cache implementations

29. Presentational components must not:

* Call SQLite or Drizzle directly
* Call HTTP APIs directly
* Call repositories directly
* Access raw database rows or API DTOs
* Manage query-cache invalidation or synchronization queues
* Construct database clients, API clients, or repository adapters
* Contain authoritative workout, progression, statistics, or synchronization business rules
* Display raw database, backend, native-module, or infrastructure errors
* Fetch data already owned by a parent container

30. Small reusable UI components should remain presentational.

Examples include:

```text
Button
TextInput
NumericInput
FormField
SetRow
ExerciseCard
ProgramCard
StatCard
ChartLegend
BottomSheet
Dialog
EmptyState
LoadingSkeleton
```

These components should receive values and callbacks through props.

31. Fetch workout data at the highest meaningful owner that needs to coordinate it.

Use the following rule:

```text
The screen already owns the query or active-workout state
→ Pass the resulting model to child containers or components

The container is the first meaningful owner that needs the data
→ The container calls the query hook
```

32. Do not pass an identifier through multiple layers solely so a deeply nested component can fetch data that is already available higher in the component tree.

33. Do not issue the same query independently from several small child components when one parent container can load the data once and pass it downward.

Avoid:

```tsx
function ExerciseNameRow({ exerciseId }: { exerciseId: string }) {
  const exerciseQuery = useExerciseQuery(exerciseId);

  return <Text>{exerciseQuery.data?.name}</Text>;
}
```

Prefer:

```tsx
function ActiveWorkoutContainer({ sessionId }: { sessionId: string }) {
  const sessionQuery = useWorkoutSessionQuery(sessionId);

  return (
    <ActiveWorkoutScreen
      session={sessionQuery.data}
      exercises={sessionQuery.data?.exercises ?? []}
    />
  );
}
```

34. Workout data should normally be obtained through query hooks built on top of repositories.

Use this flow:

```text
Presentational component
        ^
        |
Container
        |
        v
Query or mutation hook
        |
        v
Repository
        |
        v
SQLite / Drizzle and/or Backend API
```

35. Repositories should define how workout data is obtained and submitted.

Repositories may handle:

* SQLite and Drizzle queries
* HTTP requests
* API endpoint details
* Database row types
* API request DTOs
* API response DTOs
* Local and remote data coordination
* Synchronization metadata
* Infrastructure error conversion
* Database-row-to-application-model mapping
* API-to-application-model mapping

Repositories should not normally own screen loading state, form state, component state, navigation state, or user-facing messages.

36. Use a dedicated query or application-state layer for:

* Query caching when needed
* Request deduplication
* Local database subscriptions or refreshes
* Stale-time configuration for remote data
* Retries for remote requests
* Background refetching
* Cache invalidation
* Mutation lifecycle management
* Synchronization status

37. Do not add redundant caches when SQLite, the query layer, or the active-workout store already owns the relevant state.

A separate cache is justified only when it serves a distinct requirement such as:

* Remote server-state caching
* Persistent synchronization queues
* Optimistic updates
* Expensive statistics calculations
* Native widget or Live Activity snapshots

38. Query keys must include every parameter that affects a result.

For example:

```ts
const workoutProgramKeys = {
  all: ['workout-programs'] as const,

  lists: () =>
    [...workoutProgramKeys.all, 'list'] as const,

  list: (filters: WorkoutProgramFilters) =>
    [...workoutProgramKeys.lists(), filters] as const,

  details: () =>
    [...workoutProgramKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...workoutProgramKeys.details(), id] as const,

  periodStats: (
    id: string,
    periodType: PeriodType,
    dateRange: DateRange,
  ) =>
    [
      ...workoutProgramKeys.detail(id),
      'period-stats',
      periodType,
      dateRange,
    ] as const,
};
```

39. After mutations, update or invalidate all relevant local and remote query entries.

Examples:

```text
Create workout program
→ Refresh affected program lists

Update workout program
→ Update the program detail query
→ Refresh affected program lists

Complete workout session
→ Update the session detail query
→ Refresh workout history
→ Refresh exercise statistics
→ Refresh program statistics
→ Queue remote synchronization when enabled

Delete exercise
→ Remove the exercise detail query
→ Refresh exercise lists
→ Refresh affected program and session views
```

40. Use explicit Data Mappers between persistence/API data and frontend application models.

Use these flows:

```text
Database row
     |
     v
Persistence mapper
     |
     v
Frontend application model
```

```text
API response DTO
        |
        v
API mapper
        |
        v
Frontend application model
```

41. Database rows and API DTOs must remain inside the database, API, repository, or infrastructure boundary.

Components, forms, lists, charts, screens, and presentation hooks must not depend directly on raw Drizzle row types or API DTOs when an application model exists.

42. Use separate mappers for separate boundaries.

Prefer:

```text
workout-program-persistence.mapper.ts
workout-program-api.mapper.ts
workout-program-form.mapper.ts
workout-program-card.mapper.ts
program-progress-chart.mapper.ts
exercise-history.mapper.ts
active-workout.mapper.ts
```

Avoid one universal mapper that handles database rows, API DTOs, forms, lists, charts, and all presentation formats.

43. Persistence and API mappers should handle infrastructure-related conversions such as:

* Database rows to application models
* API DTOs to application models
* Date strings or timestamps to `Date`
* Boolean integer values from SQLite
* Nullable values
* Enum values
* Nested response structures
* Load and quantity units
* Request DTO creation
* Persistence input creation
* Response DTO conversion

44. Form mappers should handle differences between application models and editable form values.

Form mappers may handle:

* Empty strings
* Numeric input strings
* Date and time input values
* Boolean controls
* Select option objects
* Multi-select values
* Optional fields
* Form-only fields
* Input trimming
* `kg`, `lb`, `band`, and custom load values
* Repetition and timed quantity values
* Conversion into local or remote mutation input models

45. Card, list, chart, and view-model mappers should handle presentation-specific transformations.

These may include:

* Formatted workout dates
* Formatted durations
* Formatted loads and units
* Program color presentation
* Chart labels
* Program progress points
* Exercise strength trends
* Set-row display values
* Personal-record labels
* Display names
* Available UI actions

46. Keep English user-facing text in the presentation boundary.

Persistence mappers, API mappers, repositories, and database code should not produce user-facing labels unless the value is already supplied as presentation content.

47. Forms should use the following default data flow:

```text
Query hook
    |
    v
Container
    |
    v
Workout application model
    |
    v
Form mapper
    |
    v
Form initial values
    |
    v
Form component
    |
    v
Form-state hook
```

48. The form container should normally:

* Fetch or receive the workout, program, exercise, or session model
* Handle loading and error states
* Map the model to form initial values
* Own the mutation
* Map submitted form values to mutation input
* Handle successful submission
* Coordinate navigation after submission when required
* Handle local query refreshes, cache updates, statistics recalculation, and remote synchronization

49. The form component should normally:

* Receive `initialValues`
* Receive an `onSubmit` callback
* Receive submission and disabled states
* Own the temporary editable form draft
* Run client-side form validation
* Render fields and English validation messages

50. Pass form values into a presentational form rather than passing a raw database row or API DTO.

Prefer:

```tsx
<WorkoutProgramForm
  initialValues={
    workoutProgramFormMapper.fromProgram(program)
  }
  onSubmit={handleSubmit}
/>
```

Avoid:

```tsx
<WorkoutProgramForm programRow={programRow} />
```

51. The form component should normally call the form-state hook internally.

For example:

```tsx
function WorkoutProgramForm({
  initialValues,
  onSubmit,
}: WorkoutProgramFormProps) {
  const form = useForm<WorkoutProgramFormValues>({
    defaultValues: initialValues,
  });

  return (
    <View>
      {/* Workout program fields */}

      <Button
        title="Save program"
        onPress={form.handleSubmit(onSubmit)}
      />
    </View>
  );
}
```

52. A reusable form hook may configure:

* Form validation
* Default form behavior
* Exercise field arrays
* Set field arrays
* Dependent fields
* Dirty-state tracking
* Form-specific computed values
* Unit conversion behavior
* Reset behavior

53. A reusable form hook should not normally fetch the workout entity itself.

Avoid:

```ts
function useWorkoutProgramForm(programId: string) {
  const programQuery = useWorkoutProgramQuery(programId);
}
```

This couples the form to edit mode and hides its persistence or backend dependency.

54. A screen-level orchestration hook may combine queries, mutations, active-workout state, and native integrations when that improves readability.

For example:

```ts
function useEditWorkoutProgramScreen(programId: string) {
  const programQuery = useWorkoutProgramQuery(programId);
  const updateProgram = useUpdateWorkoutProgramMutation();

  return {
    programQuery,
    updateProgram,
  };
}
```

55. If the parent screen already fetched the application model, pass that model to the container instead of fetching it again.

For example:

```tsx
function WorkoutProgramDetailsScreen({
  programId,
}: {
  programId: string;
}) {
  const programQuery = useWorkoutProgramQuery(programId);

  if (!programQuery.data) {
    return <WorkoutProgramSkeleton />;
  }

  return (
    <EditWorkoutProgramContainer
      program={programQuery.data}
    />
  );
}
```

56. If the form container is the first meaningful component that needs the model, the container should call the query hook itself.

For example:

```tsx
function EditWorkoutProgramContainer({
  programId,
}: {
  programId: string;
}) {
  const programQuery = useWorkoutProgramQuery(programId);
  const updateProgram = useUpdateWorkoutProgramMutation();

  if (programQuery.isPending) {
    return <WorkoutProgramFormSkeleton />;
  }

  if (programQuery.isError) {
    return (
      <InlineError
        message="Unable to load this workout program."
      />
    );
  }

  return (
    <WorkoutProgramForm
      initialValues={
        workoutProgramFormMapper.fromProgram(
          programQuery.data,
        )
      }
      isSubmitting={updateProgram.isPending}
      onSubmit={values =>
        updateProgram.mutate({
          id: programId,
          input:
            workoutProgramFormMapper.toUpdateInput(
              values,
            ),
        })
      }
    />
  );
}
```

57. Treat persisted workout data and form draft state as separate values.

```text
Persisted application model
→ Last known saved local or remote state

Form values
→ Temporary editable user draft
```

Do not mutate cached query data or raw Drizzle row objects directly while the user edits a form.

58. Mount the form after its required initial data has loaded when practical.

This is the preferred default because it allows the form hook to initialize once with complete values.

59. When an already-mounted form needs to receive different persisted data, use the form library's explicit reset mechanism.

Do not reset the form after every local refresh, synchronization event, or background refetch because doing so may overwrite unsaved user changes.

Reset form state only when appropriate, such as:

* The program, exercise, or session identifier changes
* The user discards changes
* A successful save returns canonical persisted data
* A synchronization conflict is explicitly resolved
* The workflow intentionally replaces the current draft

60. Lists should normally use a list-level or widget-level container.

The list container may own:

* Pagination for remote data
* Sorting
* Search
* Filters
* Expo Router query parameters
* Local database or backend query execution
* Loading and error states
* Item view-model mapping
* Mutations and item actions
* Pull-to-refresh behavior
* Empty states

The generic `FlatList`, `SectionList`, or reusable list component should receive prepared items, item renderers, loading state, and callbacks.

61. Chart components should normally receive chart-ready data.

A chart component should not need to know:

* Which SQLite query or API endpoint was called
* What the raw database row or DTO looks like
* How query caching works
* How synchronization works
* How infrastructure errors are handled
* How workout statistics were persisted

Prefer:

```tsx
<ProgramProgressChart
  data={
    programProgressChartMapper.fromPeriodStats(
      programPeriodStatsQuery.data,
    )
  }
/>
```

62. Statistics and dashboard screens should use a hybrid container strategy.

The screen should own shared concerns such as:

* Shared date ranges
* Week, month, year, and lifetime period selection
* Selected workout program
* Selected exercise
* Shared chart filters
* Expo Router state
* Authentication or synchronization context when relevant

Independent statistics widgets may own their own query containers when they:

* Refresh independently
* Fail independently
* Are lazy-loaded
* Are reused on other screens
* Use distinct local queries or cache policies

63. Independent statistics queries should run in parallel unless one query genuinely depends on another.

64. Avoid one full-screen loading spinner when independent statistics widgets can render their own loading states.

Each widget should normally handle its own:

* Skeleton
* Empty state
* Error state
* Retry action

65. Use screen-level queries when several presentation components consume the same workout, session, program, exercise, or statistics result.

Use widget-level containers when widgets have independent data, loading, refresh, synchronization, or error behavior.

66. Every user-facing text in containers and presentational components must be in English, including:

* Loading messages
* Error messages
* Empty states
* Form labels
* Validation messages
* Buttons
* Dialog content
* List headings
* Chart labels
* Toast notifications
* Accessibility labels
* Live Activity and Dynamic Island text

67. Internal variables, function names, component names, type names, mapper names, hook names, and file names should remain in English.

68. When modifying existing mobile/frontend code, migrate touched data-driven features toward these container, mapper, repository, query-layer, and presentation patterns without introducing unnecessary rewrites or architectural exceptions.


# Human-in-the-Loop Development

Do not make large implementation changes without first ensuring I understand and approve what is being changed.

The goal is not to maximize how much code you can produce. The goal is to keep me actively involved in understanding and controlling the development of the codebase.

## Before Any Significant Change

If a task would involve any of the following:

- multiple files
- a new feature or subsystem
- architectural changes
- database/schema changes
- new abstractions
- new dependencies
- significant state-management changes
- substantial refactoring
- more than roughly 100 lines of meaningful new or changed code

STOP before implementing it.

First inspect the relevant code and explain to me:

1. How the current implementation works.
2. Which files/components/systems are involved.
3. What you think needs to change.
4. Why that change is necessary.
5. The proposed implementation approach.
6. Any important trade-offs or alternatives.
7. Approximately how large the change will be.

Then wait for my approval before writing the implementation.

## Break Large Work Into Stages

Never implement a large feature in one pass.

Break it into small, independently understandable stages.

For example:

Stage 1 — types/data model  
Stage 2 — core logic  
Stage 3 — integration  
Stage 4 — UI  
Stage 5 — edge cases and cleanup

Before each significant stage, explain what you are about to change and why.

Wait for my approval before proceeding to the next stage when the stage introduces substantial new behavior or architecture.

## Make Sure I Understand

Do not assume that approval means I understand the implementation.

When introducing an important concept, briefly explain how it fits into the existing system.

If the implementation depends on a design decision that I may reasonably want control over, present the decision before coding it.

Do not hide architectural decisions inside generated code.

## Small Changes Are Different

For small, obvious changes such as:

- fixing a typo
- changing styling
- correcting a simple condition
- changing a constant
- fixing a localized bug
- adding a small validation rule

you may implement directly.

Do not create unnecessary approval checkpoints for trivial changes.

## Do Not Snowball Tasks

If I ask for A, do not silently implement A + B + C because they appear related.

If you discover additional work that would improve the implementation, tell me about it separately.

Do not perform that additional work until I approve it.

## Prefer Understandable Code

Do not generate large abstractions merely to make the implementation look sophisticated.

Prefer code that I can inspect and understand.

Avoid:

- unnecessary abstraction layers
- premature generalization
- speculative infrastructure
- excessive helper functions
- large generated frameworks around simple features
- replacing existing systems without a concrete reason

If a straightforward implementation works, prefer it.

## When Existing Code Is Unclear

Do not immediately rewrite it.

Investigate it first.

Explain:

- what it currently does
- why it appears to have been designed that way
- what problems you found
- whether changing it is actually necessary

Then let me decide whether it should be refactored.

## Final Rule

For substantial work, the sequence must be:

**Inspect → Explain → Propose → Get approval → Implement small stage → Review → Continue**

Never:

**Prompt → Generate hundreds of lines → Explain afterward**

I should be able to understand how the application evolves as we build it.