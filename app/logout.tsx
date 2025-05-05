import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function Logout() {
  useEffect(() => {
    (async () => {
      const isWeb = Platform.OS === "web";
      isWeb ? localStorage.removeItem("key") : await AsyncStorage.removeItem("key");
      isWeb ? localStorage.removeItem("session") : await AsyncStorage.removeItem("session");
      router.replace("/");
    })();
  });
}