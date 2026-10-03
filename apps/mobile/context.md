# 🚨 MOBILE CONTEXT — KEEP CURRENT

> **MANDATORY:** Update this file in the same change as every major mobile change to modules, navigation, state, persistence, native integrations, or algorithms. Describe the latest code, not an older or planned design.

## System-wide architecture

### Runtime and navigation

- **Stack:** Expo/React Native with Expo Router; workout data is local-first.
- **Tabs:** History, Workout, Insights, Progress, Settings in app/(tabs)/_layout.tsx.
- **Other routes:** app/program-workout/ creates/edits blueprints; app/session-workout/ shows ongoing/saved sessions.
- **Bootstrap:** app/_layout.tsx waits for Drizzle migrations, starts exercise seeding asynchronously, then mounts SQLite, React Query, ongoing-session, and rest-timer providers plus the Live Activity coordinator.
- **Shared UI/navigation:** src/navigation/ contains navigation policy; src/components/ contains tab rail and reusable UI. Theme choice is in AsyncStorage.
- **API boundary:** apps/api is not connected to mobile today.

### Persistence and state

- **Active database:** db/index.ts opens gym_diary.db through Drizzle; db/tables.ts and db/relations.ts define schema; drizzle/ contains migrations.
- **Old helper:** src/lib/app-database.ts opens a different filename but has no callers; it is not the active DB.
- **Blueprint graph:** exercises; program_folders → program_workouts → ordered program_exercises → ordered program_sets.
- **Log graph:** workout_sessions → ordered session_exercises → session_sets. Logs snapshot names/targets/values and retain nullable source IDs.
- **Derived tables:** exercise_stats, exercise_period_stats, program_stats, program_period_stats.
- **Photos:** Files and metadata live outside SQLite.
- **Typical flow:** Route/hook → feature repository → Drizzle row → feature factory/model → UI.
- **Cache/state split:** Workout screens mostly use local state + repositories; template folders and progress photos use React Query; active-workout context coordinates the current session.
- **Current UI boundary:** Several older routes/components mix orchestration, repository access, and rendering. AGENTS.md defines the container/presentation direction for touched features.

### Shared score algorithm (packages/strength-score)

- **Inputs:** Completed numeric kg/lb repetition sets; lb is converted to kg. Timed, band, custom, and invalid loads have no e1RM.
- **Set score:** RIR = 10 − RPE; effective reps = performed reps + RIR, compressed above six. Piecewise e1RM uses Brzycki, Epley, then Wathan as reps increase.
- **Exercise score:** Arithmetic mean of valid completed-set e1RMs.
- **Workout score:** Geometric mean of valid exercise-score / stored exercise-baseline ratios; current mobile wiring uses default weights. Ratio 1 is baseline.
- **Aggregate:** ScoreAggregateV1 indexes sets by exercise and caches set/exercise/workout scores.
- **Other shared package:** packages/exercise supplies exercise types and default library data.

### Native module: workout-live-update (Android)

- **Files:** apps/mobile/modules/workout-live-update/ (Kotlin Expo module); apps/mobile/plugins/withWorkoutLiveUpdate.js (native setup).
- **Flow:** The JS Live Activity coordinator sends session/rest snapshots → Kotlin module → notification manager.
- **Algorithm:** Normalize expired rest time, post workout progress, schedule AlarmManager callback at rest completion, then update the notification.
- **State:** SharedPreferences stores active session and dismissal; a dismissed notification is not reposted for that session.
- **End:** Cancel alarm/notification and clear stored state.
- **Choice:** Native scheduling continues while JS is suspended. iOS uses the separate expo-widgets adapter in session-workout/live-activity/.

## Screens and workflows: app/

### Route shells and redirects

- **app/index.tsx:** Redirects the root URL to the Workout tab; it has no independent screen state.
- **app/_layout.tsx:** Boot/migration/provider shell and stack registration, not a user workflow screen.
- **app/(tabs)/_layout.tsx:** Five main tabs and their custom rail; History is the tab layout's initial route, while the root redirect opens Workout.
- **app/(tabs)/insights/_layout.tsx:** Hidden-tab navigation among Insights home, Exercise, and Program sections; the nested layouts provide list/detail stacks.
- **app/(tabs)/insights/exercise/_layout.tsx:** Exercise list/detail stack with its own title and back-to-list path.
- **app/(tabs)/insights/program/_layout.tsx:** Program list/detail stack with its own title and back-to-list path.
- **app/(tabs)/insights/progression.tsx:** Legacy route that redirects to Insights home.

### History — app/(tabs)/history.tsx

- **Purpose:** Review completed workouts on a month calendar and inspect a selected day.
- **Imports to follow:** session-workout/data/repository.ts; history/ui/date.ts, history-month-navigation.tsx, calendar-month.tsx, day-summary-card.tsx, and session-insights.tsx.
- **Load path:** monthDate + the 42 calendar cells determine an inclusive start/exclusive end; getCompletedInRange reads sessions. The effect reruns when monthDate or ongoing-session mutationVersion changes.
- **Prepare view:** Group by local startedAt day; choose a day's color from its longest session; calculate score growth against the previous scored session and day set/volume figures.
- **Workflow:** Open tab → query completed sessions across the visible 42-day grid → change month or tap day → see day summary and session rows → tap a session to open /session-workout/[id].
- **State/data:** Route owns month, selected local date, loading/error, grouping, and day figures; repository reads completed sessions. No mutation here.

### Workout — app/(tabs)/workout.tsx

- **Purpose:** Manage program blueprints/folders and control the current workout.
- **Imports to follow:** program-workout/hooks/use-workout-programs.tsx, template-folder/hooks/use-template-folders.ts, program-workout/utils/index.ts, session-workout/hooks/use-ongoing-session.tsx, and session-workout/ui/finish-session-prompt.ts.
- **Load/prepare:** Mirror loaded programs in templateProgram for drag UI; combine them with folders and open/closed state through buildRows; use-session-timer.tsx formats the active banner's elapsed time.
- **Workflow:** Load programs/folders → expand/rename/create/delete folders, create/edit/delete programs, or drag programs between visible groups.
- **Program actions:** Tapping starts from that program; long-press edits it in /program-workout/[id]. New program opens /program-workout/new, optionally with folderId; delete asks for confirmation then uses the program hook.
- **Start:** Choose a program or one-off session → provider creates/saves it → navigate to /session-workout/ongoing. If one is already active, choose to keep, finish, or discard it before starting another.
- **Active workout:** Ongoing banner opens /session-workout/[id]; Finish uses the program-save prompt, completes the session, and may route to a program draft.
- **Drag/write path:** applyDragResult returns visible programs plus hidden ones; only changed folderId values are saved through WorkoutProgramRepository. Visual drag ordering is local.
- **State boundary:** Folder writes use React Query mutations; program list uses a local-state hook; start/finish/discard use the ongoing-session provider.

### Insights home — app/(tabs)/insights/index.tsx

- **Purpose:** Exercise activity overview and entry points to Exercise and Program insights.
- **Imports to follow:** exercise/data/exercise-repository.ts, exercise-stats/data/repository.ts, exercise-period-stats/data/repository.ts; the overview builders live in this route file.
- **Load path:** Promise.all fetches library names, distinct-session usage summaries, and all exercise-period rows into screen state.
- **Prepare view:** buildWeekBuckets groups weekly period rows; 4W/12W selects recent week buckets and matching rows, while All time uses usage summaries. Preview rows map exercise IDs to names.
- **Workflow:** Load exercise library, usage summaries, and exercise-period rows in parallel → select 4W, 12W, or All time → view counts/activity/preview → enter Exercise or Program list.
- **State/data:** Screen owns time lens and derived preview; repository reads are local and do not mutate data.

### Exercise insights list — app/(tabs)/insights/exercise/index.tsx

- **Purpose:** Choose the exercise whose progress to inspect.
- **Code path:** This route renders exercise/components/exercise-library-picker.tsx; that picker fetches library rows and usage summaries, ranks search results, and emits the selected exercise.
- **Workflow:** ExerciseLibraryPicker loads/browses/searches exercises with usage information → tap one → replace route with /insights/exercise/[exerciseId].
- **State/data:** Picker owns its query/search; no workout mutation.

### Exercise insights detail — app/(tabs)/insights/exercise/[exerciseId].tsx

- **Purpose:** Show one exercise's lifetime statistics and period trends.
- **Imports to follow:** exercise/data/exercise-repository.ts, exercise-stats/data/repository.ts, exercise-period-stats/data/repository.ts and their lifetime/period/delta/trend view components.
- **Load/prepare:** Promise.all reads the named exercise, lifetime row, and all period rows for exerciseId. Filter by selected periodType, sort by periodStart, and pass latest/all rows to the widgets.
- **Workflow:** Read exercise, lifetime stat, and period stats in parallel → choose week/month/year (month initially) → show latest bucket, delta, and strength-score trend.
- **State/data:** Screen filters/sorts fetched period rows; it shows loading/error states and does not write.

### Program insights list — app/(tabs)/insights/program/index.tsx

- **Purpose:** Choose the program whose statistics to inspect.
- **Code path:** program-workout/hooks/use-workout-programs.tsx supplies root program rows; this route computes the name filter and passes display fields to its ProgramRow.
- **Workflow:** Load programs via useWorkoutPrograms → filter names by case-insensitive substring → tap a row → replace route with /insights/program/[programId].
- **State/data:** Local search text and program-hook loading/error; no mutation.

### Program insights detail — app/(tabs)/insights/program/[programId].tsx

- **Purpose:** Show one program's lifetime and period statistics.
- **Imports to follow:** program-workout/data/workout-program-repository.ts, program-stats/data/repository.ts, program-period-stats/data/repository.ts and lifetime/period/delta/trend view components.
- **Load/prepare:** Promise.all reads program, lifetime row, and all period rows for programId. Filter/sort by chosen periodType and pass latest/all rows to the widgets.
- **Workflow:** Read program, lifetime stat, and period rows in parallel → choose week/month/year (week initially) → show latest period, delta, and trend.
- **State/data:** Screen filters/sorts local rows and shows loading/error; no mutation.

### Progress — app/(tabs)/progress.tsx

- **Purpose:** Browse and compare progress photos; the route renders ProgressPhotosContainer.
- **Imports to follow:** progress-photo/containers/progress-photos-container.tsx is the screen owner; hooks/use-progress-photos.ts wraps data/repository.ts; ui/ mappers prepare pairs/trackers/view transforms; components/progress-photo-screen.tsx renders.
- **Load/prepare:** Query photos and tracker names → derive active group and its photos → choose latest/default selected photo and a valid same-group comparison → preload nearby images.
- **Workflow:** Select pose tracker/photo → browse timeline and same-group comparison → hold or tap to switch images, or open original/alignment editor.
- **Capture entry:** Take photo or New pose chooses/reuses a group ID, requests camera permission, checks progress-pose-runtime.ts, then lazy-loads progress-photo-camera-container or offers ImagePicker regular-camera fallback.
- **Guided camera mode:** Select a saved reference, adjust its overlay opacity, follow pose/framing guidance, then use manual shutter or opt-in automatic capture. The camera container turns the capture into photo/pose data for saving.
- **Save path:** saveCapturedPhoto validates fresh pose data through pose/progress-pose-capture.ts, computes identity/reference alignment through pose/progress-photo-alignment.ts, then calls the create mutation; repository copies file and saves metadata.
- **Alignment editor mode:** Pan, pinch, or rotate the selected image against its reference → save manual transform, reset to automatic alignment, or clear alignment; Cancel keeps the saved transform.
- **Other writes:** Tracker rename uses its name hook; alignment save uses update mutation; delete first confirms (especially for a referenced photo) then deletes through repository. Query cache refreshes after mutations.

### Settings — app/(tabs)/settings/index.tsx

- **Purpose:** Set display theme and workout auto-end timeout.
- **Code path:** NativeWind useColorScheme + AsyncStorage key theme control display; session-workout/hooks/use-ongoing-session.tsx exposes the timeout and its persistence.
- **Workflow:** Choose light/dark theme → persist to AsyncStorage and apply NativeWind scheme.
- **Auto-end:** Edit a positive minute value and confirm, or disable; invalid input resets to the current value. Ongoing-session provider persists the setting.

### New program — app/program-workout/new.tsx

- **Purpose:** Build and save a new program blueprint.
- **Imports to follow:** program-workout/domain/factory.ts, data/program-form-draft-store.ts, data/workout-program-repository.ts, and ui/form.tsx (which composes program-exercise and program-set forms plus exercise picker).
- **Initialize:** Factory creates blank form data, optionally with folderId. If draftKey exists, consume the one-time AsyncStorage draft and replace initial form state.
- **Workflow:** Start blank or preassigned to a folder; optional draftKey consumes a finish-workout program draft → edit name/exercises/target sets in form → require nonblank name → map form to domain → repository save → return to Workout.
- **Exit:** Cancel returns to Workout without saving.

### Edit program — app/program-workout/[id].tsx

- **Purpose:** Change an existing blueprint.
- **Imports to follow:** the same form/factory/repository as New program, plus data/program-form-draft-store.ts for a finish-workout draft.
- **Initialize:** Validate route ID → repository.get loads nested graph → factory maps to editable form → optional draftKey replaces that form with the proposed session-derived changes.
- **Workflow:** Load full program graph by ID → map to form, optionally consume a finish-workout draft → edit fields/exercises/sets → validate nonblank name → map back with original program ID → repository save → return to Workout.
- **States:** Invalid/missing ID or load failure shows an error; Cancel returns without saving.

### Ongoing session — app/session-workout/ongoing.tsx

- **Purpose:** Edit the active workout from ongoing-session context.
- **Imports to follow:** session-workout/hooks/use-ongoing-session.tsx, session-exercise/data/repository.ts, session-set/data/repository.ts, session-exercise/domain/factory.ts, exercise-library-picker.tsx, and use-rest-timer.tsx.
- **Initialize:** Refresh provider session → map its exercise graph to screen view rows → batch-load recent progress points for visible exercise IDs.
- **Workflow:** Load/refresh provider session → show exercise cards and recent progress history → add library exercises through sessionExerciseRepository → add/complete sets through sessionSetRepository and refresh provider state. Card expansion stays local UI state.
- **Write path:** Exercise picker selection becomes SessionExerciseFactory rows and is saved (with optimistic cards); set add/commit saves one set row, bumps mutationVersion, refreshes provider, and may start rest after completion.
- **Rest:** Completing a set can start a rest timer. The screen does not own the Finish action; Workout tab runs the finish prompt.
- **After finish:** If provider clears while this route remains open, it reloads the last session by ID and switches to completed/read-only view.

### Session by ID — app/session-workout/[id].tsx

- **Purpose:** Open a specific workout, including a completed log from History or an active log from Workout.
- **Imports to follow:** session-workout/data/repository.ts loads the route ID; session-exercise/data/repository.ts batches progress history; session-set/data/repository.ts saves set changes; exercise picker and rest-timer hook support active edits.
- **Initialize:** getInitialSessionData loads name/status/exercises, maps view rows, and attaches recent per-exercise progress; status determines editability.
- **Workflow:** Read session by route ID and batched exercise progress history → render ordered exercise/set cards.
- **Active state:** Exercise picker creates/saves new session-exercise rows; set add/commit saves through SessionSetRepository; completed-set events may start rest.
- **Completed state:** Render read-only; back goes to History. Active back goes to Workout. The Finish prompt is on Workout.

### Picker test route — app/test.tsx

- **Purpose:** Development harness for ExerciseLibraryPicker, not a main tab.
- **Workflow:** Select/create exercises in multi-select picker → confirm → store selected IDs locally and show an alert/log.

## Feature modules: src/features/

### exercise

- **Owns:** Local exercise CRUD, exercise model/factory, load hook, and library picker.
- **Data path:** db/seeds/ loads defaults from packages/exercise; data/exercise-repository.ts maps SQLite rows; hooks/use-exercises.ts loads them into local React state.
- **Picker algorithm:** Used exercises rank first by most recent use, then count; remaining exercises sort by name. Case-insensitive search ranks prefix matches before later substring matches.
- **Model rules:** Trim names; default quantity unit to reps. No scoring here.
- **Boundary note:** exercise-library-picker.tsx currently fetches exercises and usage itself; it is a data-owning UI component.

### template-folder

- **Owns:** Optional grouping and sortIndex for programs; no session data.
- **Data path:** Repository reads folders by sortIndex then createdAt. use-template-folders.ts uses one React Query key and updates/invalidate cache after mutations.
- **Grouping algorithm:** program-workout/utils/index.ts puts unknown/missing folder IDs under Unassigned and builds visible rows from open folders.
- **Drag algorithm:** Walk visible rows, assign each program the preceding folder header, then append hidden programs so collapsed items survive.
- **Persistence caveat:** Workout route saves changed folder membership; visual reorder itself is local and not stored as program order.
- **Choice:** Folder grouping stays separate from workout targets and saved logs.

### program-workout

- **Owns:** Aggregate root for reusable program → ordered exercises → target sets.
- **Data path:** domain/factory.ts maps DB/domain/form graphs. Repository get(id) loads ordered children; getAll lists roots. use-workout-programs.ts owns local loading/error/refetch state.
- **Insert algorithm:** Serialize root, exercises, sets; insert all three levels in one transaction.
- **Update algorithm:** Load existing child IDs; diff against submitted IDs; delete sets before exercises, then update/insert children in foreign-key-safe order.
- **Why IDs matter:** Unchanged child IDs are retained so session source references still point to the same targets.
- **UI/state:** ui/form.tsx edits graph; ui/template-row.tsx renders a row. use-session-timer.tsx formats elapsed active-session wall time, separate from rest.
- **Draft handoff:** data/program-form-draft-store.ts keeps a proposed program in AsyncStorage while navigating from workout finish to the new/edit form.

### program-exercise

- **Owns:** One ordered blueprint exercise, its library link, quantity unit, note, and target sets.
- **Data path:** data/factory.ts maps the child graph; repository can load one, all, or all for a program with ordered sets.
- **Standalone save algorithm:** Insert exercise + sets in a transaction; update diffs set IDs and deletes/updates/inserts them; delete removes sets before exercise.
- **UI:** ui/form.tsx edits this section and adds/removes target sets.
- **Boundary:** Whole-program changes usually go through program-workout's aggregate repository; strength calculations happen elsewhere.

### program-set

- **Owns:** Leaf blueprint target: quantity, load/unit, RPE, rest, note.
- **Data path:** domain/factory.ts and data/repository.ts map/store the row; ui/form.tsx owns target input.
- **Rest algorithm:** domain/rest.ts defines 120-second default; normalize by flooring and clamping to nonnegative seconds.
- **Input algorithm:** Clean numeric kg/lb decimals and quantity/rest text; keep band/custom loads in their own representation; remember numeric values across unit switches.
- **Boundary:** Targets are copied into sessions; they are not performed values or e1RM calculations.

### session-workout

- **Owns:** Actual workout aggregate, ongoing-session context, session repository, program-save transforms, rest/auto-end, and native Live Activity coordination.
- **Create algorithm:** domain/factory.ts copies a program into new session/exercise/set IDs with ordered target snapshots and nullable source links; blank sessions are also supported.
- **Repository:** Transactional graph insert. On update, omitted exercises change only the parent; a nonempty exercise graph replaces children. An empty exercise array does not currently clear old children.
- **Active state:** use-ongoing-session.tsx stores active ID and last-interaction time in AsyncStorage, reloads the SQLite row on launch, and exposes start/finish/discard/refresh plus a mutation version.
- **Finish sequence:** Reload latest row → clamp end ≥ start → apply completed non-warmup values to matching source targets when changed → compute/store scores → mark completed → update lifetime/period stats → set missing exercise baselines → clear active ID.
- **Program structural changes:** Added sets can become a reviewed new/update/copy draft; pure reconciliation is in domain/program-save.ts.
- **Auto-end:** Default 20 idle minutes or disabled; persisted interaction time + AppState/timer checks. Finish at inactivity threshold and send local notification.
- **Rest:** use-rest-timer.tsx persists start/end timestamps and derives remaining time from Date.now, so suspension does not reset countdown.
- **Live Activity:** coordinator.tsx derives a snapshot from session/rest state; iOS and Android adapters cross the native boundary.
- **Choice:** Session snapshots preserve history; timestamps and latest-row reload protect workflows across restart/backgrounding.

### session-exercise

- **Owns:** Logged exercise child with snapshot name, order, quantity unit, sets, and optional library/program links.
- **Data path:** domain/factory.ts maps rows. data/repository.ts supports CRUD and batched history. components/form.tsx edits sets and calls ongoing/rest context; progress component renders trend.
- **History query:** getProgressHistoryByExerciseIds joins completed sessions, exercises, and sets for unique exercise IDs in one query.
- **History algorithm:** Group rows by session exercise; use completed non-warmup positive-quantity sets; compute kg volume and best e1RM, falling back to exercise score/load.
- **Chart output:** Keep newest N sessions per exercise, then reverse into chronological points. Repository currently formats some date/best-set labels.
- **Set/rest behavior:** Form adds a set using the prior set's context and can start rest for a selected set.
- **Choice:** Batched IDs avoid one database query per exercise card.

### session-set

- **Owns:** Performed set: actual quantity/load/RPE, completion/warmup, rest, source set ID, e1RM/version.
- **Data path:** domain/factory.ts maps rows; data/repository.ts does single-row CRUD; components/form.tsx owns the editable row and callbacks.
- **Completion rule:** Positive finite quantity, valid optional numeric load, and RPE; form supplies default RPE when needed.
- **Rep-set algorithm:** Upsert completed set into ScoreAggregateV1; save returned e1RM and score version.
- **Timed-set algorithm:** Stopwatch = saved base seconds + elapsed wall-clock seconds since start; commit seconds as quantity, with no e1RM.
- **Workflow:** Form records interaction for auto-end and handles load-unit-specific input.
- **Choice:** Performed values remain separate from program targets; wall-clock stopwatch handles background time better than render ticks.

### history

- **Owns:** Calendar/date helpers, day/session presentation, and cross-module StatService.
- **Screen flow:** app/(tabs)/history.tsx owns month/selected day and queries completed sessions for the visible grid; it derives some day figures directly from sets.
- **Calendar algorithm:** ui/date.ts builds a stable 42-cell Monday-first local-date grid and YYYY-MM-DD local keys.
- **Grouping:** Completed sessions group by local day; selected-day summaries include completed set counts and kg volume.
- **StatService:** On finish, coordinate program/exercise lifetime updates and week/month/year period updates; each repository owns its SQL.
- **Choice:** Local-day keys avoid UTC date shifts; StatService coordinates without absorbing each statistic's calculation.

### exercise-stats

- **Owns:** Lifetime per-exercise read model in exercise_stats, plus usage summaries.
- **Data path:** Repository calculates/persists; factory maps; use-exercise-stats.tsx exposes a React Query view; exercise-stat-view.tsx renders.
- **Incremental algorithm:** For a completed session, add exercise/sample/set/quantity/kg-volume deltas and keep max exercise score/set e1RM from completed non-warmup work.
- **Baseline:** Finish workflow fills a missing baseline from the first valid score; normal reads/rebuild preserve it for comparable normalized scores.
- **Other reads:** listUsageSummaries counts distinct completed sessions and last use for the picker; computeLifetimeStat rebuilds totals from all completed history.
- **Caveat:** Incremental upsert is additive; calling it twice for one completion double-counts. Full rebuild is the repair path.
- **Choice:** Stored totals make lifetime widgets cheap to read.

### exercise-period-stats

- **Owns:** Per-exercise week/month/year read model and summary/delta/trend components.
- **Bucket algorithm:** Use finished session's local start date; week begins Monday, month/year begin on calendar boundary; range end is exclusive.
- **Recompute:** For exercise IDs in that session, SQL scans completed work in the affected bucket and updates sample/set counts, positive quantity, best scores/e1RM, and kg volume from completed non-warmup numeric kg/lb sets.
- **Write:** Update existing exercise/period row or insert in one transaction.
- **Current gap:** Median strength/e1RM columns are written as null; they are not calculated trends.
- **Choice:** Recomputing only touched buckets avoids accumulating duplicate period deltas.

### program-stats

- **Owns:** Lifetime per-source-program read model in program_stats; program-stats-view.tsx renders it.
- **Scope:** Ignore sessions with no source program; require completed session/end time for incremental update.
- **Incremental algorithm:** Compute positive duration plus completed non-warmup set/repetition/kg-volume deltas, then add them to existing totals transactionally.
- **Rebuild:** computeLifetimeStat scans all completed program sessions and retains existing medianProgression.
- **Caveat:** Additive update is not safe to repeat for the same completion.
- **Choice:** Persisted totals make program summary reads inexpensive.

### program-period-stats

- **Owns:** Per-program week/month/year read model and period summary/delta/trend components.
- **Bucket algorithm:** Use source program and finished session's local start-date bucket; recompute the full affected bucket from completed sessions.
- **Totals:** Count sessions with valid positive duration; sum duration and completed non-warmup numeric kg/lb volume.
- **Progression:** Fetch last valid score before bucket; walk valid in-bucket scores chronologically; average (current − previous) / previous; use zero when no pair exists.
- **Write:** Insert/update deterministic program:period:start row transactionally.
- **Choice:** Prior score measures first session's change in the bucket; full-bucket recompute avoids additive drift.

### progress-photo

- **Owns:** Photo capture/import, pose groups, guided comparison, alignment, and viewer; separate from workout SQLite.
- **Layers:** containers/ own selection, permissions, queries, mutations, pair choice, preloading. components/ render. ui/ mappers prepare view data. hooks/ wrap React Query. pose/ holds pure algorithms/platform adapters.
- **Storage:** Repository copies images into app-private documents and stores URI/date/group/reference/landmarks/alignment metadata in AsyncStorage. Delete removes a managed file only when no record still uses it.
- **Tracker algorithm:** Derive trackers from poseGroupId. Earliest surviving valid pose is fixed group reference; compare only within group. Names use separate AsyncStorage entries.
- **Detector:** Bundled MoveNet SinglePose Lightning TFLite, no runtime download/server inference. Throttle/rescale camera frames, parse 17 normalized landmarks/confidences, retain a recent torso-valid pose for capture.
- **Comparison:** Require enough common/torso landmarks; normalize geometry around torso center/scale. Combine relative landmarks + joint angles for pose, position + scale + rotation for framing, then weighted pose/framing/visibility for overall score.
- **Guidance:** Smooth scores/instructions. Optional auto-capture state machine: searching → matching → holding → capturing → cooldown, with distinct entry/cancel thresholds, continuous 750 ms hold, and duplicate protection.
- **Alignment:** Weighted least-squares fit of bounded translation + uniform scale + rotation to fixed reference; favor torso points, reject high residual outliers, store confidence/transform metadata.
- **Viewer:** Apply saved transforms in fixed 3:4 viewport; keep same-group pair images ready for hold/tap switch; offer original view and fallback framing when reference/alignment is missing. Original files are never rewritten.
- **Choice:** Offline files + metadata preserve originals; pure algorithms are testable without camera hardware; saved transforms keep repeat comparisons stable.
- **Deep reference:** pose/MODEL.md covers exact model, platform capability, failure, and comparison details.

## Update checklist

- **Module change:** Update its role, data flow, algorithm, and caveats above.
- **Cross-module change:** Update system-wide state and every affected module section.
- **Verify:** Check actual source, storage owner, downstream refresh, and platform-specific behavior.
- **Rules:** AGENTS.md is the architecture and human-review authority; this file records implemented behavior.
