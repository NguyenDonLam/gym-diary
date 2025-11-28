import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";

export default function Insights() {
  // All data here is placeholder. Wire these to your real selectors / API.
  const keyMetrics = [
    { id: "volume", label: "Weekly volume", value: "--" },
    { id: "frequency", label: "Sessions / week", value: "--" },
    { id: "duration", label: "Avg. session length", value: "--" },
  ];

  const modules = [
    {
      id: "muscle_distribution",
      title: "Muscle distribution",
      subtitle: "See which muscle groups get most of your volume.",
    },
    {
      id: "fatigue_recovery",
      title: "Fatigue / recovery",
      subtitle: "Readiness per muscle group across the week.",
    },
    {
      id: "frequency",
      title: "Training frequency",
      subtitle: "How often you hit each muscle group or pattern.",
    },
    {
      id: "strength_trend",
      title: "Strength trends",
      subtitle: "Long-term progress on your main lifts.",
    },
    {
      id: "joint_load",
      title: "Joint load map",
      subtitle: "Where your knee, shoulder, elbow stress accumulates.",
    },
    {
      id: "style_profile",
      title: "Training style profile",
      subtitle: "Volume vs intensity vs conditioning balance.",
    },
    {
      id: "dead_volume",
      title: "Dead volume",
      subtitle: "Sets that are too easy or not productive.",
    },
    {
      id: "performance_timing",
      title: "Time-to-peak performance",
      subtitle: "When in a session you usually perform best.",
    },
  ];

  const handleOpenModule = (id: string) => {
    // wire to navigation: e.g. router.push(`/insights/${id}`)
    console.log("open insights module", id);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            High-level view of how you actually train.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* KEY METRICS STRIP */}
          <View style={styles.metricsRow}>
            {keyMetrics.map((m) => (
              <View key={m.id} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* QUICK CHART PLACEHOLDERS */}
          <View style={styles.chartBlock}>
            <Text style={styles.sectionTitle}>Volume and trends</Text>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>7-day volume trend</Text>
              <Text style={styles.chartHint}>
                Render line / bar chart for total sets or tonnage here.
              </Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Muscle group distribution</Text>
              <Text style={styles.chartHint}>
                Render stacked bar / radial chart for muscles here.
              </Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Fatigue vs recovery</Text>
              <Text style={styles.chartHint}>
                Render per-muscle readiness curve / traffic light bars here.
              </Text>
            </View>
          </View>

          {/* ADVANCED MODULES LIST – TAP TO OPEN DETAILED GRAPHS */}
          <View style={styles.modulesBlock}>
            <Text style={styles.sectionTitle}>Advanced insights</Text>

            {modules.map((mod) => (
              <Pressable
                key={mod.id}
                style={styles.moduleRow}
                onPress={() => handleOpenModule(mod.id)}
              >
                <View style={styles.moduleMain}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
                </View>
                <Text style={styles.moduleChevron}>{">"}</Text>
              </Pressable>
            ))}
          </View>

          {/* BOTTOM SPACER FOR THUMB AREA */}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // metrics
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
  },

  // charts block
  chartBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  chartCard: {
    height: 140, // placeholder space for actual chart
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  chartHint: {
    fontSize: 11,
  },

  // modules list
  modulesBlock: {
    marginTop: 4,
  },
  moduleRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moduleMain: {
    flexShrink: 1,
    paddingRight: 8,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  moduleSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  moduleChevron: {
    fontSize: 16,
  },
});
