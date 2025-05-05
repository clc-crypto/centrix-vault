import Texts from "@/components/Texts";
import { Colors, Standards } from "@/components/Theme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function Index() {
  const styles = StyleSheet.create({
    all: {
      padding: 15
    },
    allHolder: {
      display: "flex",
      alignItems: "center"
    },
    button: {
      width: "80%",
      paddingVertical: 10,
      paddingHorizontal: 20,
      marginVertical: 10,
      backgroundColor: Colors.primary,
      borderRadius: Standards.borderRadius,
      display: "flex",
      alignItems: "center"
    }
  });

  return (
    <ScrollView style={styles.all}>
      <View style={styles.allHolder}>
        <Texts.Heading>Centrix Vault</Texts.Heading>

        <TouchableOpacity style={styles.button} onPress={() => router.push("/(tabs)")}>
          <Texts.Regular style={{ color: "#fff" }}>Open Wallet</Texts.Regular>
        </TouchableOpacity>

        <Texts.Regular style={{ color: Colors.textLight }}>Don't have a wallet yet?</Texts.Regular>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/register")}>
          <Texts.Regular style={{ color: "#fff" }}>Create a new Wallet</Texts.Regular>
        </TouchableOpacity>

        <Texts.Regular style={{ color: Colors.textLight }}>Or log out now</Texts.Regular>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/logout")}>
          <Texts.Regular style={{ color: "#fff" }}>Logout</Texts.Regular>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}