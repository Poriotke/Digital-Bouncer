import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PINModal } from "@/components/PINModal";
import {
  ALL_APPS,
  LIFE_SUPPORT_EXTRAS,
  SYSTEM_WHITELIST,
  useAegis,
} from "@/context/AegisContext";
import { useColors } from "@/hooks/useColors";

const SYSTEM_APPS_META = [
  { id: "phone", name: "Phone", icon: "phone", color: "#34C759" },
  { id: "messages", name: "Messages", icon: "message", color: "#0072C6" },
  { id: "clock", name: "Clock", icon: "clock-outline", color: "#FF9500" },
  { id: "settings", name: "Settings", icon: "cog", color: "#8E8E93" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    whitelist,
    addToWhitelist,
    removeFromWhitelist,
    setPin,
    verifyPin,
    resetUsageData,
    pin,
    guardMode,
  } = useAegis();

  const [changePinOpen, setChangePinOpen] = useState(false);
  const [verifyPinOpen, setVerifyPinOpen] = useState(false);
  const [newPinOpen, setNewPinOpen] = useState(false);
  const [newPin, setNewPin] = useState("");

  const extraAppsInWhitelist = whitelist.filter(
    (id) => !SYSTEM_WHITELIST.includes(id)
  );
  const availableExtras = LIFE_SUPPORT_EXTRAS.filter(
    (a) => !extraAppsInWhitelist.includes(a.id)
  );
  const canAddMore = extraAppsInWhitelist.length < 3;

  const handleAddExtra = (id: string) => {
    if (!canAddMore) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToWhitelist(id);
  };

  const handleRemoveExtra = (id: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeFromWhitelist(id);
  };

  const handleResetData = () => {
    if (Platform.OS === "web") {
      resetUsageData();
      return;
    }
    Alert.alert(
      "Reset Usage Data",
      "This will reset today's usage tracking to fresh simulated data. Your limits and settings are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetUsageData();
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const getExtraAppMeta = (id: string) => {
    return LIFE_SUPPORT_EXTRAS.find((a) => a.id === id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              LIFE SUPPORT
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
              <MaterialCommunityIcons name="heart-pulse" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>Always On</Text>
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            These apps bypass all locks. System core cannot be modified.
          </Text>

          {SYSTEM_APPS_META.map((app) => (
            <View
              key={app.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: app.color + "22" }]}>
                <MaterialCommunityIcons name={app.icon as any} size={20} color={app.color} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{app.name}</Text>
              <View style={[styles.lockBadge, { backgroundColor: colors.primary + "18" }]}>
                <MaterialCommunityIcons name="lock" size={12} color={colors.primary} />
                <Text style={[styles.lockText, { color: colors.primary }]}>Fixed</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.subsectionLabel, { color: colors.mutedForeground }]}>
            YOUR EXTRAS ({extraAppsInWhitelist.length}/3)
          </Text>

          {extraAppsInWhitelist.map((id) => {
            const meta = getExtraAppMeta(id);
            if (!meta) return null;
            return (
              <View
                key={id}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: meta.accentColor + "22" }]}>
                  <MaterialCommunityIcons name={meta.iconName as any} size={20} color={meta.accentColor} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>{meta.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveExtra(id)}
                  style={[styles.removeBtn, { borderColor: colors.destructive + "44" }]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="minus" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            );
          })}

          {canAddMore && availableExtras.length > 0 && (
            <>
              <Text style={[styles.subsectionLabel, { color: colors.mutedForeground }]}>
                ADD MORE ({3 - extraAppsInWhitelist.length} slots left)
              </Text>
              <View style={styles.extrasGrid}>
                {availableExtras.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    onPress={() => handleAddExtra(app.id)}
                    style={[styles.extraChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name={app.iconName as any} size={16} color={colors.mutedForeground} />
                    <Text style={[styles.extraChipText, { color: colors.foreground }]}>{app.name}</Text>
                    <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SECURITY</Text>

          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (guardMode === "parent") {
                setVerifyPinOpen(true);
              } else {
                setNewPinOpen(true);
              }
            }}
            style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
              <MaterialCommunityIcons name="lock-reset" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Change PIN</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {guardMode === "parent" ? "Verify current PIN first" : "Set a new PIN for Parent Mode"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetData}
            style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.warning + "18" }]}>
              <MaterialCommunityIcons name="refresh" size={20} color={colors.warning} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Reset Usage Data</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Resets today's tracking to fresh data
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
          <View style={[styles.creditsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.creditsHeader}>
              <MaterialCommunityIcons name="shield-lock" size={28} color={colors.primary} />
              <View>
                <Text style={[styles.creditsTitle, { color: colors.foreground }]}>AEGIS</Text>
                <Text style={[styles.creditsVersion, { color: colors.mutedForeground }]}>
                  v1.0.0-Stable
                </Text>
              </View>
            </View>
            <View style={[styles.creditsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.creditRow}>
              <Text style={[styles.creditKey, { color: colors.mutedForeground }]}>Lead Architect</Text>
              <Text style={[styles.creditVal, { color: colors.foreground }]}>P.o.Riot 🍄</Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={[styles.creditKey, { color: colors.mutedForeground }]}>Philosophy</Text>
              <Text style={[styles.creditVal, { color: colors.foreground }]}>Discipline through digital restriction</Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={[styles.creditKey, { color: colors.mutedForeground }]}>Concept</Text>
              <Text style={[styles.creditVal, { color: colors.foreground }]}>The Digital Bouncer</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
              Full system-level monitoring (UsageStatsManager / FamilyControls) requires a native device build with Usage Access permission. The Expo Go preview uses simulated usage data.
            </Text>
          </View>
        </View>
      </ScrollView>

      <PINModal
        visible={verifyPinOpen}
        title="Verify Current PIN"
        onSubmit={verifyPin}
        onSuccess={() => {
          setVerifyPinOpen(false);
          setNewPinOpen(true);
        }}
        onCancel={() => setVerifyPinOpen(false)}
      />

      <PINModal
        visible={newPinOpen}
        title="Set New PIN"
        subtitle="Choose a 4-digit PIN for Parent Mode"
        confirmMode
        onSuccess={() => {
          setNewPinOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 16 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  sectionDesc: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  subsectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginTop: 16, marginBottom: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lockText: { fontSize: 11, fontWeight: "700" },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  extrasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  extraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  extraChipText: { fontSize: 13, fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
  },
  actionText: { flex: 1 },
  creditsCard: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  creditsHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  creditsTitle: { fontSize: 20, fontWeight: "900", letterSpacing: 3 },
  creditsVersion: { fontSize: 12, marginTop: 2 },
  creditsDivider: { height: 1 },
  creditRow: { gap: 2 },
  creditKey: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  creditVal: { fontSize: 14 },
  disclaimerBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
