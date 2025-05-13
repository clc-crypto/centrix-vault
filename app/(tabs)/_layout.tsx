import { Tabs } from "expo-router";
import { Colors } from "@/components/Theme";
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import loadWallet from "@/components/Wallet";

export default function TabLayout() {
  const [inTx, setInTx] = useState(false);
  const [tick, setTick] = useState(0);

  setInterval(() => setTick(tick + 1), 20000);

  useEffect(() => {
    (async () => {
      const w = await loadWallet();
      if (!w) return;
      if (w.currentTx) setInTx(true);
      else setInTx(false);
    })();
  }, [tick]);

  return <Tabs screenOptions={{
    tabBarActiveTintColor: Colors.primary,
    tabBarStyle: {
      height: 60
    }
  }}>
    <Tabs.Screen name="index" options={{ headerTitle: 'Centrix Vault',
      tabBarLabel: "Your Vault",
      tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "wallet" : "wallet-outline"} size={30} color={color} />,
    }} />
    <Tabs.Screen name="send" options={{ headerTitle: 'Send CLC',
      tabBarLabel: "Send",
      tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "arrow-up" : "arrow-up-outline"} size={30} color={color} />,
    }} />
    <Tabs.Screen name="receive" options={{ headerTitle: 'Receive CLC',
      tabBarLabel: "Receive",
      tabBarBadge: inTx ? "1" : undefined,
      tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "arrow-down" : "arrow-down-outline"} size={30} color={color} />,
    }} />
    <Tabs.Screen name="logout" options={{ headerTitle: 'Logout',
      tabBarLabel: "Logout",
      tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? "log-out" : "log-out-outline"} size={30} color={color} />,
    }} />
  </Tabs>;
}
