import Texts from "@/components/Texts";
import { Colors, Standards } from "@/components/Theme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function Index() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    all: {
      alignItems: "center",
      display: "flex",
      gap: 30,
      marginVertical: 100,
    },
    content: {
      padding: 20,
    },
    heading: {
      marginBottom: 20,
      textAlign: "center",
      maxWidth: 500,
    },
    description: {
      marginBottom: 40,
      lineHeight: 22,
      textAlign: "center",
      color: Colors.textLight,
      maxWidth: 500,
    },
    button: {
      width: "90%",
      paddingVertical: 14,
      marginVertical: 10,
      backgroundColor: Colors.primary,
      borderRadius: Standards.borderRadius,
      alignItems: "center",
      maxWidth: 500,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      maxWidth: 500,
    },
    secondaryText: {
      marginTop: 30,
      marginBottom: 8,
      color: Colors.textLight,
      maxWidth: 500,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.all}>
        <Texts.Heading style={styles.heading}>Centrix Vault</Texts.Heading>

        <Texts.Medium style={styles.description}>
          Centrix Vault is the new official wallet for Centrix. Packed with brand new features like QR code scanning to make sending CLC easier, and many more quality of life changes.
        </Texts.Medium>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(tabs)")}
        >
          <Texts.Regular style={styles.buttonText}>Open Wallet</Texts.Regular>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
