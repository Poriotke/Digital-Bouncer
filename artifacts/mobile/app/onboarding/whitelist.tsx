import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAegis, LIFE_SUPPORT_EXTRAS, SYSTEM_WHITELIST } from "@/context/AegisContext";

const SYSTEM_APPS = [
  { id: "phone", name: "Phone", icon: "phone" as const, color: "#34C759" },
  { id: "messages", name: "Messages", icon: "message" as const, color: "#0072C6" },
  { id: "clock", name: "Clock", icon: "clock-outline" as const, color: "#FF9500" },
  { id: "settings", name: "Settings", icon: "cog" as const, color: "#8E8E93" },
];

export default function WhitelistSetup() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToWhitelist, completeOnboarding } = useAegis();
  const [selected, setSelected] = useState<string[]>([]);

  const MAX_EXTRA = 3;

  const toggleExtra = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_EXTRA) {
      setSelected([...selected, id]);
    }
  };

  const handleActivate = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (const id of [...SYSTEM_WHITELIST, ...selected]) {
      await addToWhitelist(id);
    }
    await completeOnboarding();
    router.replace("/(tabs)/pulse");
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="heart-pulse" size={36} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>Life Support</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            These apps are always accessible — even when AEGIS locks your device.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              SYSTEM CORE — PERMANENT
            </Text>
            <View style={[styles.lockBadge, { backgroundColor: colors.primary + "22" }]}>
              <MaterialCommunityIcons name="lock" size={12} color={colors.primary} />
              <Text style={[styles.lockBadgeText, { color: colors.primary }]}>Fixed</Text>
            </View>
          </View>
          {SYSTEM_APPS.map((app) => (
            <View
              key={app.id}
              style={[styles.appRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.appIcon, { backgroundColor: app.color + "22", borderColor: app.color + "44" }]}>
                <MaterialCommunityIcons name={app.icon} size={22} color={app.color} />
              </View>
              <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              YOUR CHOICE — UP TO {MAX_EXTRA}
            </Text>
            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
              {selected.length}/{MAX_EXTRA}
            </Text>
          </View>
          <View style={styles.extrasGrid}>
            {LIFE_SUPPORT_EXTRAS.map((app) => {
              const isSelected = selected.includes(app.id);
              const isDisabled = !isSelected && selected.length >= MAX_EXTRA;
              return (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => toggleExtra(app.id)}
                  disabled={isDisabled}
                  style={[
                    styles.extraChip,
                    {
                      backgroundColor: isSelected ? colors.primary + "22" : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={app.iconName as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.extraName,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {app.name}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: botPad + 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleActivate}
          style={[styles.activateBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="shield-check" size={22} color={colors.primaryForeground} />
          <Text style={[styles.activateBtnText, { color: colors.primaryForeground }]}>
            Activate AEGIS
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32, gap: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: 1 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lockBadgeText: { fontSize: 11, fontWeight: "700" },
  countLabel: { fontSize: 13, fontWeight: "600" },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  appName: { flex: 1, fontSize: 15, fontWeight: "600" },
  extrasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  extraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  extraName: { fontSize: 14, fontWeight: "500" },
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 18,
  },
  activateBtnText: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});
