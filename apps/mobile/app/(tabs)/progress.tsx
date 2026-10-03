/**
 * Progress tab route flow:
 * - Render ProgressPhotosContainer from features/progress-photo/containers.
 * - That container owns photo queries, capture, grouping, comparisons,
 *   alignment, mutations, and the screen UI; this route only mounts it.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
import React from "react";

import { ProgressPhotosContainer } from "@/src/features/progress-photo/containers/progress-photos-container";

export default function ProgressRoute() {
  return <ProgressPhotosContainer />;
}
