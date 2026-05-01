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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface PINModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  onSubmit?: (pin: string) => boolean;
  confirmMode?: boolean;
}

export function PINModal({
  visible,
  title = "Enter PIN",
  subtitle,
  onSuccess,
  onCancel,
  onSubmit,
  confirmMode = false,
}: PINModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [confirmDigits, setConfirmDigits] = useState<string[]>([]);
  const [confirmStep, setConfirmStep] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDigits([]);
      setConfirmDigits([]);
      setConfirmStep(false);
      setError(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const currentDigits = confirmStep ? confirmDigits : digits;
  const setCurrentDigits = confirmStep ? setConfirmDigits : setDigits;

  const handlePress = (num: string) => {
    if (currentDigits.length >= 4) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDigits = [...currentDigits, num];
    setCurrentDigits(newDigits);
    setError(false);

    if (newDigits.length === 4) {
      setTimeout(() => {
        if (confirmMode) {
          if (!confirmStep) {
            setConfirmStep(true);
          } else {
            if (digits.join("") === newDigits.join("")) {
              onSuccess();
            } else {
              shake();
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setError(true);
              setConfirmDigits([]);
              setDigits([]);
              setConfirmStep(false);
            }
          }
        } else if (onSubmit) {
          const ok = onSubmit(newDigits.join(""));
          if (!ok) {
            shake();
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(true);
            setCurrentDigits([]);
          } else {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
          }
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    if (currentDigits.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDigits(currentDigits.slice(0, -1));
  };

  if (!visible) return null;

  const KEYS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "DEL"],
  ];

  const displayTitle = confirmMode
    ? confirmStep
      ? "Confirm PIN"
      : title
    : title;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: "rgba(0,0,0,0.95)", opacity: fadeAnim },
      ]}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{displayTitle}</Text>
        {subtitle && !confirmStep && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
        {confirmStep && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Re-enter your new PIN to confirm
          </Text>
        )}
        {error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {confirmMode ? "PINs do not match. Try again." : "Incorrect PIN. Try again."}
          </Text>
        )}

        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < currentDigits.length
                      ? error
                        ? colors.destructive
                        : colors.primary
                      : colors.border,
                  borderColor: error ? colors.destructive : colors.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        <View style={styles.keypad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key, ki) => (
                <View key={ki} style={styles.keyWrapper}>
                  {key === "" ? (
                    <View style={styles.keyEmpty} />
                  ) : key === "DEL" ? (
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={[styles.keyButton, { backgroundColor: colors.surface }]}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.keyText, { color: colors.mutedForeground, fontSize: 14 }]}>
                        ⌫
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handlePress(key)}
                      style={[styles.keyButton, { backgroundColor: colors.surface }]}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.keyText, { color: colors.foreground }]}>{key}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 40,
    marginBottom: 48,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  keypad: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  keyRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  keyWrapper: {
    flex: 1,
    maxWidth: 90,
  },
  keyEmpty: {
    width: "100%",
    aspectRatio: 1.6,
  },
  keyButton: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "500",
  },
  cancelBtn: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
