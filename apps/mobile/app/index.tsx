/**
 * Root route flow:
 * - Expo Router renders Index when the app opens at /.
 * - Redirect immediately replaces this route with the Workout tab at
 *   /(tabs)/workout; this page owns no data or UI state.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/workout" />;
}
