import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAegis } from "@/context/AegisContext";
import { useColors } from "@/hooks/useColors";

export default function RootIndex() {
  const { loading, onboardingComplete } = useAegis();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/pulse" />;
}
