import { v4 as uuidv4 } from "uuid";

export function generateId(): string {
  if (typeof global === "object" && global.crypto?.randomUUID) {
    return global.crypto.randomUUID();
  }
  return uuidv4();
}
