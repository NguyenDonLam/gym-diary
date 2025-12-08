// src/features/template-set/data/type.ts

import { InferSelectModel } from "drizzle-orm";
import { LoadUnit } from "../domain/type";
import { setPrograms } from "@/db/schema";

export type SetProgramRow = InferSelectModel<typeof setPrograms>;
