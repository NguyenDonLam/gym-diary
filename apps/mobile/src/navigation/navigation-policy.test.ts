import assert from "node:assert/strict";
import test from "node:test";
import { TabRouter } from "expo-router/build/react-navigation/routers/TabRouter";
import { StackRouter } from "expo-router/build/react-navigation/routers/StackRouter";
import {
  insightsTabBackBehavior,
  mainTabBackBehavior,
} from "./navigation-policy";

const options = (routeNames: string[]) => ({
  routeNames,
  routeParamList: {},
  routeGetIdList: {},
});

test("History -> Moves/Plans repeated six times creates no back steps", () => {
  const main = TabRouter({
    initialRouteName: "history",
    backBehavior: mainTabBackBehavior,
  });
  const mainOptions = options([
    "history",
    "workout",
    "insights",
    "progress",
    "settings/index",
  ]);
  const initial = main.getInitialState(mainOptions);
  const active = main.getRehydratedState(
    main.getStateForAction(
      initial,
      { type: "NAVIGATE", payload: { name: "insights" } },
      mainOptions,
    )!,
    mainOptions,
  );
  const insights = TabRouter({
    initialRouteName: "index",
    backBehavior: insightsTabBackBehavior,
  });
  const insightOptions = options([
    "index",
    "exercise",
    "program",
    "progression",
  ]);
  let state = insights.getInitialState(insightOptions);
  for (const name of [
    "exercise",
    "program",
    "exercise",
    "program",
    "exercise",
    "program",
  ]) {
    state = insights.getRehydratedState(
      insights.getStateForAction(
        state,
        { type: "NAVIGATE", payload: { name } },
        insightOptions,
      )!,
      insightOptions,
    );
  }
  assert.equal(state.routes[state.index].name, "program");
  assert.equal(state.history.length, 1);
  // Neither child nor main tabs retain navigation history.
  assert.equal(
    insights.getStateForAction(state, { type: "GO_BACK" }, insightOptions),
    null,
  );
  assert.equal(
    main.getStateForAction(active, { type: "GO_BACK" }, mainOptions),
    null,
  );
});

test("revisiting main tabs keeps no previous visits", () => {
  const router = TabRouter({
    initialRouteName: "history",
    backBehavior: mainTabBackBehavior,
  });
  const config = options(["history", "workout", "insights"]);
  let state = router.getInitialState(config);
  for (const name of [
    "workout",
    "insights",
    "workout",
    "insights",
    "workout",
    "insights",
  ]) {
    state = router.getRehydratedState(
      router.getStateForAction(
        state,
        { type: "NAVIGATE", payload: { name } },
        config,
      )!,
      config,
    );
  }
  assert.equal(state.history.length, 1);
  assert.equal(
    router.getStateForAction(state, { type: "GO_BACK" }, config),
    null,
  );
});

test("opening and leaving details replaces the page without back steps", () => {
  const router = StackRouter({ initialRouteName: "index" });
  const config = options(["index", "[exerciseId]"]);
  const list = router.getInitialState(config);
  const detail = router.getRehydratedState(
    router.getStateForAction(
      list,
      {
        type: "REPLACE",
        payload: { name: "[exerciseId]", params: { exerciseId: "squat" } },
      },
      config,
    )!,
    config,
  );
  assert.equal(detail.routes.length, 1);
  assert.equal(
    router.getStateForAction(detail, { type: "GO_BACK" }, config),
    null,
  );
  const returned = router.getRehydratedState(
    router.getStateForAction(
      detail,
      { type: "REPLACE", payload: { name: "index" } },
      config,
    )!,
    config,
  );
  assert.equal(returned.routes.length, 1);
  assert.equal(returned.routes[returned.index].name, "index");
});
