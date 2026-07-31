import React from "react";

import type { ProgressPhotoCameraContainerProps } from "./progress-photo-camera.types";

export function ProgressPhotoCameraContainer({
  onCancel,
}: ProgressPhotoCameraContainerProps) {
  React.useEffect(() => {
    onCancel();
  }, [onCancel]);

  return null;
}
