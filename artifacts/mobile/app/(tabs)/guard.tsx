import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppUsageBar } from "@/components/AppUsageBar";
import { LimitModal } from "@/components/LimitModal";
import { PINModal } from "@/components/PINModal";
import { ALL_APPS, AppInfo, GuardMode, useAegis } from "@/context/AegisContext";
import { useColors } from "@/hooks/useColors";

const MODES: { id: GuardMode; label: string; icon: string; desc: string; color: string }[] = [
  {
    id: "off",
    label: "Off",
    icon: "shield-off",
    desc: "No enforcement. Tracking only.",
    color: "#6B7280",
  },
  {
    id: "parent",
    label: "Parent",
    icon: "shield-lock",
    desc: "PIN required to override limits.",
    color: "#00E5FF",
  },
  {
    id: "nuclear",
    label: "Nuclear",
    icon: "shield-alert",
    desc: "Zero-override hard lock. No exceptions.",
    color: "#FF3366",
  },
];

function AddAppModal({
  visible,
  onClose,
  onSelect,
  existingIds,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (app: AppInfo) => void;
  existingIds: string[];
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const available = ALL_APPS.filter((a) => !existingIds.includes(a.id));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Set App Limit</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
          {available.map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => onSelect(app)}
              style={[styles.addAppRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.miniIcon, { backgroundColor: app.accentColor + "22" }]}>
                <MaterialCommunityIcons name={app.iconName as any} size={18} color={app.accentColor} />
              </View>
              <Text style={[styles.addAppName, { color: colors.foreground }]}>{app.name}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
          {available.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              All apps have limits set.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GuardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { apps, usage, limits, lockedApps, guardMode, setGuardMode, setLimit, removeLimit, unlockApp, verifyPin } = useAegis();

  const [limitModalApp, setLimitModalApp] = useState<AppInfo | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<GuardMode | null>(null);
  const [unlockApp_, setUnlockApp] = useState<AppInfo | null>(null);
  const [unlockPinOpen, setUnlockPinOpen] = useState(false);

  const appsWithLimits = apps.filter((a) => limits[a.id] !== undefined);
  const appsWithoutLimits = apps.filter((a) => limits[a.id] === undefined);

  const handleModePress = (mode: GuardMode) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === guardMode) return;
    if (guardMode === "parent" || mode === "parent") {
      setPendingMode(mode);
      setPinModalOpen(true);
    } else {
      setGuardMode(mode);
    }
  };

  const handlePinSuccess = () => {
    setPinModalOpen(false);
    if (pendingMode) {
      setGuardMode(pendingMode);
      setPendingMode(null);
    }
  };

  const handleUnlockPress = (app: AppInfo) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (guardMode === "parent") {
      setUnlockApp(app);
      setUnlockPinOpen(true);
    } else if (guardMode === "off") {
      unlockApp(app.id);
    }
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const currentModeData = MODES.find((m) => m.id === guardMode)!;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>The Guard</Text>

          <View
            style={[
              styles.modeStatusBar,
              { backgroundColor: currentModeData.color + "18", borderColor: currentModeData.color + "44" },
            ]}
          >
            <MaterialCommunityIcons
              name={currentModeData.icon as any}
              size={18}
              color={currentModeData.color}
            />
            <Text style={[styles.modeStatusLabel, { color: currentModeData.color }]}>
              {currentModeData.label.toUpperCase()} MODE ACTIVE
            </Text>
            <Text style={[styles.modeStatusDesc, { color: currentModeData.color + "AA" }]}>
              {currentModeData.desc}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GUARD MODE</Text>
          <View style={styles.modesRow}>
            {MODES.map((m) => {
              const active = guardMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleModePress(m.id)}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: active ? m.color + "22" : colors.card,
                      borderColor: active ? m.color : colors.border,
                      flex: 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={m.icon as any} size={26} color={active ? m.color : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.modeLabel,
                      { color: active ? m.color : colors.foreground },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {guardMode === "parent" && (
            <View style={[styles.pinHint, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
              <Text style={[styles.pinHintText, { color: colors.primary }]}>
                PIN required to change mode or unlock apps. Default PIN: 1234
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              APP LIMITS — {appsWithLimits.length} SET
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAddModalOpen(true);
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {appsWithLimits.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="shield-plus" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Limits Set</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Tap "Add" to set a daily time limit for an app.
              </Text>
            </View>
          )}

          {appsWithLimits.map((app) => (
            <View key={app.id} style={styles.limitedAppRow}>
              <AppUsageBar
                app={app}
                usageMinutes={usage[app.id] ?? 0}
                limitMinutes={limits[app.id]}
                isLocked={!!lockedApps[app.id]}
                onPress={() => {
                  if (lockedApps[app.id]) {
                    handleUnlockPress(app);
                  } else {
                    setLimitModalApp(app);
                  }
                }}
              />
              {lockedApps[app.id] && guardMode !== "nuclear" && (
                <TouchableOpacity
                  onPress={() => handleUnlockPress(app)}
                  style={[styles.unlockBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="lock-open" size={14} color={colors.destructive} />
                  <Text style={[styles.unlockBtnText, { color: colors.destructive }]}>
                    {guardMode === "parent" ? "Unlock with PIN" : "Unlock"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <LimitModal
        visible={!!limitModalApp}
        app={limitModalApp}
        currentLimit={limitModalApp ? limits[limitModalApp.id] : undefined}
        onSave={setLimit}
        onRemove={removeLimit}
        onClose={() => setLimitModalApp(null)}
      />

      <AddAppModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        existingIds={appsWithLimits.map((a) => a.id)}
        onSelect={(app) => {
          setAddModalOpen(false);
          setLimitModalApp(app);
        }}
      />

      <PINModal
        visible={pinModalOpen}
        title="Guard Access"
        subtitle="Enter your PIN to change guard mode"
        onSubmit={verifyPin}
        onSuccess={handlePinSuccess}
        onCancel={() => {
          setPinModalOpen(false);
          setPendingMode(null);
        }}
      />

      <PINModal
        visible={unlockPinOpen}
        title="Unlock App"
        subtitle={`Enter PIN to unlock ${unlockApp_?.name}`}
        onSubmit={verifyPin}
        onSuccess={() => {
          setUnlockPinOpen(false);
          if (unlockApp_) unlockApp(unlockApp_.id);
          setUnlockApp(null);
        }}
        onCancel={() => {
          setUnlockPinOpen(false);
          setUnlockApp(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 16 },
  modeStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  modeStatusLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  modeStatusDesc: { fontSize: 12, flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modesRow: { flexDirection: "row", gap: 10 },
  modeCard: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  modeLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  pinHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  pinHintText: { flex: 1, fontSize: 12, lineHeight: 18 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  addBtnText: { fontSize: 13, fontWeight: "700" },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  limitedAppRow: { gap: 4 },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: -2,
  },
  unlockBtnText: { fontSize: 13, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    maxHeight: "70%",
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  addAppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addAppName: { flex: 1, fontSize: 15, fontWeight: "500" },
  emptyText: { textAlign: "center", padding: 24, fontSize: 14 },
});
