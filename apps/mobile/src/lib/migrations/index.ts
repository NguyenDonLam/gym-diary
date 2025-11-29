import { migrate0To1 } from "./0_to_1_initial";


export const migrations = [
  migrate0To1, // index 0: 0->1
];

export const APP_SCHEMA_VERSION = migrations.length;
