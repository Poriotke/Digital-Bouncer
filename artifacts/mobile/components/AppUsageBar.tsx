import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { AppInfo } from "@/context/AegisContext";

interface AppUsageBarProps {
  app: AppInfo;
  usageMinutes: number;
  limitMinutes?: number;
  isLocked?: boolean;
  isActive?: boolean;
  onPress?: () => void;
}

function formatTime(minutes: number): string {
  if (minutes < 1) return `${Math.floor(minutes * 60)}s`;
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function AppUsageBar({
  app,
  usageMinutes,
  limitMinutes,
  isLocked = false,
  isActive = false,
  onPress,
}: AppUsageBarProps) {
  const colors = useColors();
  const pct = limitMinutes ? Math.min(usageMinutes / limitMinutes, 1) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const barColor = isLocked
    ? colors.destructive
    : pct >= 0.9
    ? colors.warning
    : pct >= 0.7
    ? "#FFB800"
    : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : isLocked ? colors.destructive : colors.border,
          borderWidth: isActive || isLocked ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: app.accentColor + "22",
              borderColor: app.accentColor + "44",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={app.iconName as any}
            size={20}
            color={app.accentColor}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.appName, { color: colors.foreground }]} numberOfLines={1}>
              {app.name}
            </Text>
            {isActive && (
              <Animated.View style={[styles.liveDot, { opacity: glowAnim, backgroundColor: colors.primary }]} />
            )}
            {isLocked && (
              <MaterialCommunityIcons name="lock" size={12} color={colors.destructive} style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  backgroundColor: barColor,
                  width: widthAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.timeUsed, { color: isLocked ? colors.destructive : colors.foreground }]}>
          {formatTime(usageMinutes)}
        </Text>
        {limitMinutes && (
          <Text style={[styles.timeLimit, { color: colors.mutedForeground }]}>
            / {formatTime(limitMinutes)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  timeUsed: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  timeLimit: {
    fontSize: 11,
    marginTop: 1,
  },
});
