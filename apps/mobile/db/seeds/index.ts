// src/lib/db/seeds/index.ts
import { seedAnteriorProgramDemo } from "./seed-anterior-program-demo";
import { seedDefaultExercises } from "./seed-default-exercises";
import { seedProgramSessionDemo } from "./seed-program-session-demo";
import { seedPullUpInsightsDemo } from "./seed-pull-up-insights-demo";

export async function runAllSeeds(db: any) {
  await seedDefaultExercises(db);
  await seedAnteriorProgramDemo(db);
  await seedPullUpInsightsDemo(db);
  await seedProgramSessionDemo(db);
}
