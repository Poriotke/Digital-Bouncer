import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface AppInfo {
  id: string;
  name: string;
  iconName: string;
  category: string;
  accentColor: string;
  isSystemApp?: boolean;
}

export type GuardMode = "off" | "parent" | "nuclear";

interface AegisState {
  apps: AppInfo[];
  usage: Record<string, number>;
  limits: Record<string, number>;
  guardMode: GuardMode;
  pin: string;
  whitelist: string[];
  lockedApps: Record<string, boolean>;
  onboardingComplete: boolean;
  loading: boolean;
  nuclearActive: boolean;
  activeAppId: string | null;
  dailyResetTime: string;
}

interface AegisContextType extends AegisState {
  setLimit: (appId: string, minutes: number) => Promise<void>;
  removeLimit: (appId: string) => Promise<void>;
  setGuardMode: (mode: GuardMode) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  addToWhitelist: (appId: string) => Promise<void>;
  removeFromWhitelist: (appId: string) => Promise<void>;
  unlockApp: (appId: string) => Promise<void>;
  dismissNuclear: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetUsageData: () => Promise<void>;
  simulateApp: (appId: string | null) => void;
  totalUsageMinutes: number;
}

export const SYSTEM_WHITELIST = ["phone", "messages", "clock", "settings"];

export const ALL_APPS: AppInfo[] = [
  { id: "instagram", name: "Instagram", iconName: "instagram", category: "Social", accentColor: "#E1306C" },
  { id: "youtube", name: "YouTube", iconName: "youtube", category: "Entertainment", accentColor: "#FF0000" },
  { id: "twitter", name: "X / Twitter", iconName: "twitter", category: "Social", accentColor: "#1DA1F2" },
  { id: "tiktok", name: "TikTok", iconName: "music-note", category: "Entertainment", accentColor: "#69C9D0" },
  { id: "reddit", name: "Reddit", iconName: "reddit", category: "Social", accentColor: "#FF4500" },
  { id: "netflix", name: "Netflix", iconName: "netflix", category: "Entertainment", accentColor: "#E50914" },
  { id: "whatsapp", name: "WhatsApp", iconName: "whatsapp", category: "Messaging", accentColor: "#25D366" },
  { id: "discord", name: "Discord", iconName: "pound-box", category: "Messaging", accentColor: "#5865F2" },
  { id: "chrome", name: "Chrome", iconName: "google-chrome", category: "Utility", accentColor: "#4285F4" },
  { id: "spotify", name: "Spotify", iconName: "spotify", category: "Music", accentColor: "#1DB954" },
  { id: "snapchat", name: "Snapchat", iconName: "snapchat", category: "Social", accentColor: "#FFFC00" },
  { id: "facebook", name: "Facebook", iconName: "facebook", category: "Social", accentColor: "#1877F2" },
  { id: "gmail", name: "Gmail", iconName: "gmail", category: "Productivity", accentColor: "#EA4335" },
  { id: "telegram", name: "Telegram", iconName: "send", category: "Messaging", accentColor: "#2AABEE" },
  { id: "twitch", name: "Twitch", iconName: "twitch", category: "Entertainment", accentColor: "#9146FF" },
];

export const LIFE_SUPPORT_EXTRAS: AppInfo[] = [
  { id: "maps", name: "Maps", iconName: "map-marker", category: "Utility", accentColor: "#4285F4" },
  { id: "music", name: "Music", iconName: "music", category: "Music", accentColor: "#FC3C44" },
  { id: "camera", name: "Camera", iconName: "camera", category: "Utility", accentColor: "#888888" },
  { id: "calculator", name: "Calculator", iconName: "calculator", category: "Utility", accentColor: "#FF9500" },
  { id: "wallet", name: "Wallet", iconName: "wallet", category: "Finance", accentColor: "#34C759" },
  { id: "banking", name: "Banking", iconName: "bank", category: "Finance", accentColor: "#1B4F72" },
  { id: "health", name: "Health", iconName: "heart-pulse", category: "Health", accentColor: "#FF2D55" },
  { id: "email", name: "Email", iconName: "email", category: "Productivity", accentColor: "#0072C6" },
];

const STORAGE_KEYS = {
  USAGE: "@aegis:usage",
  LIMITS: "@aegis:limits",
  GUARD_MODE: "@aegis:guardMode",
  PIN: "@aegis:pin",
  WHITELIST: "@aegis:whitelist",
  LOCKED_APPS: "@aegis:lockedApps",
  ONBOARDING: "@aegis:onboarding",
  RESET_DATE: "@aegis:resetDate",
};

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getSeededUsage(): Record<string, number> {
  const seed = new Date().getDate();
  const result: Record<string, number> = {};
  ALL_APPS.forEach((app, i) => {
    const base = ((seed * (i + 7)) % 90) + 5;
    result[app.id] = base;
  });
  return result;
}

const AegisContext = createContext<AegisContextType | null>(null);

export function AegisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AegisState>({
    apps: ALL_APPS,
    usage: getSeededUsage(),
    limits: {},
    guardMode: "off",
    pin: "1234",
    whitelist: SYSTEM_WHITELIST,
    lockedApps: {},
    onboardingComplete: false,
    loading: true,
    nuclearActive: false,
    activeAppId: null,
    dailyResetTime: getTodayString(),
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (state.loading) return;

    tickRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.activeAppId) return prev;
        const appId = prev.activeAppId;
        const newUsage = {
          ...prev.usage,
          [appId]: (prev.usage[appId] ?? 0) + 1 / 60,
        };
        const limit = prev.limits[appId];
        const newLocked = { ...prev.lockedApps };
        let nuclearActive = prev.nuclearActive;

        if (limit && newUsage[appId] >= limit) {
          newLocked[appId] = true;
          if (prev.guardMode === "nuclear") {
            nuclearActive = true;
          }
        }

        return { ...prev, usage: newUsage, lockedApps: newLocked, nuclearActive };
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.loading, state.activeAppId]);

  async function loadAll() {
    try {
      const [
        usageRaw,
        limitsRaw,
        guardMode,
        pin,
        whitelistRaw,
        lockedRaw,
        onboarding,
        resetDate,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USAGE),
        AsyncStorage.getItem(STORAGE_KEYS.LIMITS),
        AsyncStorage.getItem(STORAGE_KEYS.GUARD_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.PIN),
        AsyncStorage.getItem(STORAGE_KEYS.WHITELIST),
        AsyncStorage.getItem(STORAGE_KEYS.LOCKED_APPS),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.RESET_DATE),
      ]);

      const today = getTodayString();
      const savedDate = resetDate ?? today;
      const isNewDay = savedDate !== today;

      let usage = usageRaw ? JSON.parse(usageRaw) : getSeededUsage();
      if (isNewDay) {
        usage = getSeededUsage();
        await AsyncStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(usage));
        await AsyncStorage.setItem(STORAGE_KEYS.LOCKED_APPS, JSON.stringify({}));
      }

      setState((prev) => ({
        ...prev,
        usage,
        limits: limitsRaw ? JSON.parse(limitsRaw) : {},
        guardMode: (guardMode as GuardMode) ?? "off",
        pin: pin ?? "1234",
        whitelist: whitelistRaw ? JSON.parse(whitelistRaw) : SYSTEM_WHITELIST,
        lockedApps: isNewDay ? {} : (lockedRaw ? JSON.parse(lockedRaw) : {}),
        onboardingComplete: onboarding === "true",
        loading: false,
        dailyResetTime: today,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }

  const setLimit = useCallback(async (appId: string, minutes: number) => {
    setState((prev) => {
      const newLimits = { ...prev.limits, [appId]: minutes };
      AsyncStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits));
      return { ...prev, limits: newLimits };
    });
  }, []);

  const removeLimit = useCallback(async (appId: string) => {
    setState((prev) => {
      const newLimits = { ...prev.limits };
      delete newLimits[appId];
      const newLocked = { ...prev.lockedApps };
      delete newLocked[appId];
      AsyncStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits));
      AsyncStorage.setItem(STORAGE_KEYS.LOCKED_APPS, JSON.stringify(newLocked));
      return { ...prev, limits: newLimits, lockedApps: newLocked };
    });
  }, []);

  const setGuardMode = useCallback(async (mode: GuardMode) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GUARD_MODE, mode);
    setState((prev) => ({ ...prev, guardMode: mode, nuclearActive: false }));
  }, []);

  const setPin = useCallback(async (pin: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PIN, pin);
    setState((prev) => ({ ...prev, pin }));
  }, []);

  const verifyPin = useCallback((pin: string) => {
    return state.pin === pin;
  }, [state.pin]);

  const addToWhitelist = useCallback(async (appId: string) => {
    setState((prev) => {
      if (prev.whitelist.includes(appId)) return prev;
      const newList = [...prev.whitelist, appId];
      AsyncStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(newList));
      return { ...prev, whitelist: newList };
    });
  }, []);

  const removeFromWhitelist = useCallback(async (appId: string) => {
    if (SYSTEM_WHITELIST.includes(appId)) return;
    setState((prev) => {
      const newList = prev.whitelist.filter((id) => id !== appId);
      AsyncStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(newList));
      return { ...prev, whitelist: newList };
    });
  }, []);

  const unlockApp = useCallback(async (appId: string) => {
    setState((prev) => {
      const newLocked = { ...prev.lockedApps, [appId]: false };
      AsyncStorage.setItem(STORAGE_KEYS.LOCKED_APPS, JSON.stringify(newLocked));
      return { ...prev, lockedApps: newLocked };
    });
  }, []);

  const dismissNuclear = useCallback(async () => {
    setState((prev) => ({ ...prev, nuclearActive: false }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
    setState((prev) => ({ ...prev, onboardingComplete: true }));
  }, []);

  const resetUsageData = useCallback(async () => {
    const fresh = getSeededUsage();
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(fresh));
    await AsyncStorage.setItem(STORAGE_KEYS.LOCKED_APPS, JSON.stringify({}));
    setState((prev) => ({ ...prev, usage: fresh, lockedApps: {} }));
  }, []);

  const simulateApp = useCallback((appId: string | null) => {
    setState((prev) => ({ ...prev, activeAppId: appId }));
  }, []);

  const totalUsageMinutes = Object.values(state.usage).reduce((a, b) => a + b, 0);

  return (
    <AegisContext.Provider
      value={{
        ...state,
        setLimit,
        removeLimit,
        setGuardMode,
        setPin,
        verifyPin,
        addToWhitelist,
        removeFromWhitelist,
        unlockApp,
        dismissNuclear,
        completeOnboarding,
        resetUsageData,
        simulateApp,
        totalUsageMinutes,
      }}
    >
      {children}
    </AegisContext.Provider>
  );
}

export function useAegis() {
  const ctx = useContext(AegisContext);
  if (!ctx) throw new Error("useAegis must be used inside AegisProvider");
  return ctx;
}
