import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="index" options={{ headerTitle: "Centrix Vault" }} />
    <Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: "Centrix Vault" }} />
    <Stack.Screen name="login" options={{ headerTitle: "Centrix Vault Login" }} />
    <Stack.Screen name="register" options={{ headerTitle: "Centrix Vault Registration" }} />
    <Stack.Screen name="logout" options={{ headerTitle: "Logout" }} />
  </Stack>;
}
