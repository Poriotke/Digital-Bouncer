import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ALL_APPS } from "@/context/AegisContext";
import { useColors } from "@/hooks/useColors";

export interface DayUsage {
  dateStr: string;
  dayLabel: string;
  shortLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  usage: Record<string, number>;
  totalMinutes: number;
}

interface UsageChartProps {
  days: DayUsage[];
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const CHART_HEIGHT = 100;

interface BarProps {
  day: DayUsage;
  heightPct: number;
  selected: boolean;
  onPress: () => void;
}

function Bar({ day, heightPct, selected, onPress }: BarProps) {
  const colors = useColors();
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: heightPct,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
      delay: day.isToday ? 0 : Math.random() * 200,
    }).start();
  }, [heightPct]);

  const barColor = selected
    ? colors.primary
    : day.isToday
    ? colors.primary + "CC"
    : day.isWeekend
    ? "#4A4A6A"
    : "#2A2A3A";

  const animatedHeight = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [4, CHART_HEIGHT],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.barCol}
    >
      <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              height: animatedHeight,
              backgroundColor: barColor,
              borderRadius: selected ? 6 : 4,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.barLabel,
          {
            color: selected || day.isToday ? colors.primary : colors.mutedForeground,
            fontWeight: selected || day.isToday ? "800" : "400",
          },
        ]}
      >
        {day.shortLabel}
      </Text>
      {selected && (
        <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export function UsageChart({ days }: UsageChartProps) {
  const colors = useColors();
  const [selectedIdx, setSelectedIdx] = useState<number>(days.length - 1);

  const maxMinutes = Math.max(...days.map((d) => d.totalMinutes), 1);
  const selectedDay = days[selectedIdx];

  const topApps = selectedDay
    ? Object.entries(selectedDay.usage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([appId, mins]) => ({
          app: ALL_APPS.find((a) => a.id === appId)!,
          mins,
        }))
        .filter((x) => x.app)
    : [];

  const handleBar = (idx: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIdx(idx);
  };

  const weekAvg =
    days.reduce((acc, d) => acc + d.totalMinutes, 0) / Math.max(days.length, 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>
            7-Day History
          </Text>
          <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>
            Avg {formatTime(weekAvg)} / day
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
          <MaterialCommunityIcons name="chart-bar" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Weekly</Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {days.map((day, i) => (
          <Bar
            key={day.dateStr}
            day={day}
            heightPct={day.totalMinutes / maxMinutes}
            selected={selectedIdx === i}
            onPress={() => handleBar(i)}
          />
        ))}
      </View>

      {selectedDay && (
        <View
          style={[
            styles.detailPanel,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.detailHeader}>
            <View>
              <Text style={[styles.detailDay, { color: colors.foreground }]}>
                {selectedDay.isToday ? "Today" : selectedDay.dayLabel}
              </Text>
              <Text style={[styles.detailTotal, { color: colors.primary }]}>
                {formatTime(selectedDay.totalMinutes)} total
              </Text>
            </View>
            <View style={styles.detailApps}>
              {topApps.map(({ app, mins }) => (
                <View key={app.id} style={styles.detailAppRow}>
                  <View
                    style={[
                      styles.detailAppDot,
                      { backgroundColor: app.accentColor },
                    ]}
                  />
                  <Text
                    style={[styles.detailAppName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {app.name}
                  </Text>
                  <Text style={[styles.detailAppTime, { color: colors.mutedForeground }]}>
                    {formatTime(mins)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.comparisonRow}>
            <MaterialCommunityIcons
              name={
                selectedDay.totalMinutes > weekAvg ? "trending-up" : "trending-down"
              }
              size={14}
              color={
                selectedDay.totalMinutes > weekAvg
                  ? colors.warning
                  : colors.success
              }
            />
            <Text
              style={[
                styles.comparisonText,
                {
                  color:
                    selectedDay.totalMinutes > weekAvg
                      ? colors.warning
                      : colors.success,
                },
              ]}
            >
              {formatTime(Math.abs(selectedDay.totalMinutes - weekAvg))}{" "}
              {selectedDay.totalMinutes > weekAvg ? "above" : "below"} weekly avg
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  chartSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: "100%",
    justifyContent: "flex-end",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "visible",
  },
  barFill: {
    width: "100%",
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  selectedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailPanel: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailDay: {
    fontSize: 13,
    fontWeight: "700",
  },
  detailTotal: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  detailApps: {
    flex: 1,
    gap: 4,
  },
  detailAppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailAppDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailAppName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  detailAppTime: {
    fontSize: 11,
    fontWeight: "600",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
