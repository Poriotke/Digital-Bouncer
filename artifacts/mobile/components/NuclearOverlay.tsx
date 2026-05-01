import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAegis } from "@/context/AegisContext";

export function NuclearOverlay() {
  const { nuclearActive, guardMode, dismissNuclear } = useAegis();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (nuclearActive) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [nuclearActive]);

  if (!nuclearActive || guardMode !== "nuclear") return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { opacity: fadeAnim },
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
      ]}
    >
      <Animated.View style={[styles.glowRing, { opacity: pulseAnim }]} />

      <View style={styles.content}>
        <MaterialCommunityIcons name="shield-lock" size={80} color="#FF3366" />
        <Text style={styles.lockedLabel}>NUCLEAR LOCK</Text>
        <Text style={styles.lockedSub}>Daily limit reached</Text>
        <Text style={styles.description}>
          Your device is in lockdown mode.{"\n"}Non-essential apps are restricted.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.lifeSupportLabel}>LIFE SUPPORT ACTIVE</Text>
        <View style={styles.lifeSupportRow}>
          {["Phone", "Messages", "Clock", "Settings"].map((name) => (
            <View key={name} style={styles.lifeSupportChip}>
              <Text style={styles.lifeSupportText}>{name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={dismissNuclear}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.emergencyText}>Emergency Dialer</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#060608",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "transparent",
    borderWidth: 60,
    borderColor: "rgba(255,51,102,0.08)",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lockedLabel: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF3366",
    letterSpacing: 4,
    marginTop: 24,
    marginBottom: 8,
  },
  lockedSub: {
    fontSize: 14,
    color: "#6B7280",
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: "#2A2A3A",
    marginVertical: 28,
  },
  lifeSupportLabel: {
    fontSize: 11,
    color: "#6B7280",
    letterSpacing: 2,
    marginBottom: 14,
    fontWeight: "700",
  },
  lifeSupportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 40,
  },
  lifeSupportChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2A2A3A",
    backgroundColor: "#12121A",
  },
  lifeSupportText: {
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
  },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A26",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  emergencyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
