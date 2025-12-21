export const QUANTITY_UNITS = ["reps", "time"] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

export const LOAD_UNITS = ["kg", "lb", "band", "custom"] as const;
export type LoadUnit = (typeof LOAD_UNITS)[number];
