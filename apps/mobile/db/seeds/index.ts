// src/lib/db/seeds/index.ts
import { seedDefaultExercises } from "./seed-default-exercises";

export async function runAllSeeds(db: any) {
  await seedDefaultExercises(db);
  // later: await seedSomeOtherThing(db);
}
