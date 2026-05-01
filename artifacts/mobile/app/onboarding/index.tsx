import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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

import { useColors } from "@/hooks/useColors";

const PILLARS = [
  {
    icon: "pulse" as const,
    label: "The Pulse",
    desc: "Live screen tracking — every app, every second",
  },
  {
    icon: "shield-lock" as const,
    label: "The Guard",
    desc: "Dual lock modes: Parent PIN or Nuclear lockdown",
  },
  {
    icon: "heart-pulse" as const,
    label: "Life Support",
    desc: "Essential apps always accessible — no exceptions",
  },
];

export default function OnboardingIndex() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/onboarding/whitelist");
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <Animated.View
        style={[styles.glow, { opacity: glowAnim }]}
      />

      <Animated.View
        style={[
          styles.heroSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.iconRing, { borderColor: colors.primary + "40" }]}>
          <View style={[styles.iconRingInner, { borderColor: colors.primary + "80" }]}>
            <MaterialCommunityIcons name="shield-lock" size={52} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.wordmark, { color: colors.foreground }]}>AEGIS</Text>
        <Text style={[styles.tagline, { color: colors.primary }]}>
          The Digital Bouncer
        </Text>
        <Text style={[styles.creditLine, { color: colors.mutedForeground }]}>
          by P.o.Riot
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.pillarsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {PILLARS.map((p, i) => (
          <View
            key={i}
            style={[
              styles.pillarRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.pillarIcon, { backgroundColor: colors.primary + "18" }]}>
              <MaterialCommunityIcons name={p.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.pillarText}>
              <Text style={[styles.pillarLabel, { color: colors.foreground }]}>{p.label}</Text>
              <Text style={[styles.pillarDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          { opacity: fadeAnim, paddingBottom: botPad + 24 },
        ]}
      >
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          AEGIS requires Usage Access permission to monitor real-time app activity.
        </Text>
        <TouchableOpacity
          onPress={handleStart}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            Initialize AEGIS
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  glow: {
    position: "absolute",
    top: -100,
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "transparent",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 80,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 40,
    marginBottom: 36,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 10,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 8,
    textTransform: "uppercase",
  },
  creditLine: {
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
  },
  pillarsSection: {
    flex: 1,
    gap: 10,
  },
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillarText: {
    flex: 1,
  },
  pillarLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingTop: 16,
    gap: 16,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
