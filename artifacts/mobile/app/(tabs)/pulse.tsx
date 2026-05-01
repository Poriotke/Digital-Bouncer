import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppUsageBar } from "@/components/AppUsageBar";
import { UsageChart } from "@/components/UsageChart";
import { useAegis } from "@/context/AegisContext";
import { useColors } from "@/hooks/useColors";
import { buildWeeklyData } from "@/utils/weeklyData";

function formatTotal(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function LiveDot() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const colors = useColors();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.liveDot, { backgroundColor: colors.primary, opacity: pulseAnim }]}
    />
  );
}

export default function PulseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    apps,
    usage,
    limits,
    lockedApps,
    activeAppId,
    simulateApp,
    resetUsageData,
    totalUsageMinutes,
  } = useAegis();

  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (activeAppId === null) {
      const idx = Math.floor(Math.random() * apps.length);
      simulateApp(apps[idx].id);
    }
  }, []);

  const sortedApps = [...apps].sort((a, b) => {
    const ua = usage[a.id] ?? 0;
    const ub = usage[b.id] ?? 0;
    const la = limits[a.id];
    const lb = limits[b.id];
    const pa = la ? ua / la : ua / 90;
    const pb = lb ? ub / lb : ub / 90;
    return pb - pa;
  });

  const handleRefresh = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await resetUsageData();
    setRefreshing(false);
  };

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const lockedCount = Object.values(lockedApps).filter(Boolean).length;
  const appsWithLimits = apps.filter((a) => limits[a.id]).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 20 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{dateStr}</Text>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>The Pulse</Text>
            </View>
            <View style={styles.liveChip}>
              <LiveDot />
              <Text style={[styles.liveLabel, { color: colors.primary }]}>LIVE</Text>
            </View>
          </View>

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {formatTotal(totalUsageMinutes)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Today's Total
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {appsWithLimits}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Monitored
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBlock}>
              <Text
                style={[
                  styles.statValue,
                  { color: lockedCount > 0 ? colors.destructive : colors.success },
                ]}
              >
                {lockedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Locked
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <UsageChart days={buildWeeklyData(usage)} />
        </View>

        <View style={styles.appsList}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              ALL APPS — {apps.length} TRACKED
            </Text>
            <TouchableOpacity
              onPress={() => {
                const idx = Math.floor(Math.random() * apps.length);
                simulateApp(apps[idx].id);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.simBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="refresh" size={14} color={colors.mutedForeground} />
              <Text style={[styles.simBtnText, { color: colors.mutedForeground }]}>Sim</Text>
            </TouchableOpacity>
          </View>

          {sortedApps.map((app) => (
            <AppUsageBar
              key={app.id}
              app={app}
              usageMinutes={usage[app.id] ?? 0}
              limitMinutes={limits[app.id]}
              isLocked={!!lockedApps[app.id]}
              isActive={activeAppId === app.id}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  dateText: { fontSize: 13, marginBottom: 4 },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,229,255,0.08)",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
  },
  statBlock: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, marginHorizontal: 8 },
  chartSection: { paddingHorizontal: 20, paddingTop: 8 },
  appsList: { paddingHorizontal: 20, paddingTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  simBtnText: { fontSize: 11, fontWeight: "600" },
});
