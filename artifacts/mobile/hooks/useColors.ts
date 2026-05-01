import { Platform, useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * AEGIS defaults to dark mode — on web, dark is always used.
 */
export function useColors() {
  const scheme = useColorScheme();
  // Force dark on web since AEGIS is dark-first
  const isDark = Platform.OS === "web" ? true : scheme === "dark";
  const palette =
    isDark && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
