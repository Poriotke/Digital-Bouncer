import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { AppInfo } from "@/context/AegisContext";

interface LimitModalProps {
  visible: boolean;
  app: AppInfo | null;
  currentLimit?: number;
  onSave: (appId: string, minutes: number) => void;
  onRemove?: (appId: string) => void;
  onClose: () => void;
}

const PRESETS = [15, 30, 45, 60, 90, 120, 180, 240];

export function LimitModal({
  visible,
  app,
  currentLimit,
  onSave,
  onRemove,
  onClose,
}: LimitModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number>(currentLimit ?? 60);

  useEffect(() => {
    if (visible) setSelected(currentLimit ?? 60);
  }, [visible, currentLimit]);

  if (!app) return null;

  const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
  };

  const handleSave = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(app.id, selected);
    onClose();
  };

  const handleRemove = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onRemove?.(app.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 24,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            {app.name}
          </Text>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            Daily Limit
          </Text>
        </View>

        <Text style={[styles.selectedLabel, { color: colors.primary }]}>
          {formatMinutes(selected)}
        </Text>

        <View style={styles.presetsGrid}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                setSelected(p);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    selected === p ? colors.primary : colors.secondary,
                  borderColor: selected === p ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color: selected === p ? colors.primaryForeground : colors.foreground,
                    fontWeight: selected === p ? "700" : "400",
                  },
                ]}
              >
                {formatMinutes(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            Set Limit
          </Text>
        </TouchableOpacity>

        {onRemove && currentLimit !== undefined && (
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.removeBtnText, { color: colors.destructive }]}>
              Remove Limit
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
  },
  category: {
    fontSize: 13,
    marginTop: 4,
  },
  selectedLabel: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: -1,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 28,
  },
  presetChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  presetText: {
    fontSize: 15,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  removeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  removeBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
