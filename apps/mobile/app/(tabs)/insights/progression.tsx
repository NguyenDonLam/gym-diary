/**
 * Legacy Insights progression route flow:
 * - Expo Router may enter this route through an old progression path.
 * - Redirect immediately replaces it with the Insights tab index at
 *   /(tabs)/insights; this page performs no query or rendering of stats.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
import React from "react";
import { Redirect } from "expo-router";

export default function ProgressionRedirect() {
  return <Redirect href="/(tabs)/insights" />;
}
