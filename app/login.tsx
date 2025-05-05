import React, { useState } from "react";
import { Animated, Dimensions, ImageBackground, ScrollView, StyleSheet, TextInput, View, Text, Platform } from "react-native";
import Texts from "@/components/Texts";
import { Colors, Standards } from "@/components/Theme";
import { TouchableOpacity } from "react-native";
import settings from "@/components/settings";
import SHA256 from 'crypto-js/sha256';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [focused, setFocused] = useState(false);
  const placeholderTop = useState(new Animated.Value(14))[0];
  const placeholderSize = useState(new Animated.Value(15))[0];

  const [focused2, setFocused2] = useState(false);
  const placeholderTop2 = useState(new Animated.Value(14))[0];
  const placeholderSize2 = useState(new Animated.Value(15))[0];

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(placeholderTop, {
      toValue: -7,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(placeholderSize, {
      toValue: 13,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (username.trim() === "") {
      Animated.timing(placeholderTop, {
        toValue: 14,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setFocused(false));
      Animated.timing(placeholderSize, {
        toValue: 15,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleFocus2 = () => {
    setFocused2(true);
    Animated.timing(placeholderTop2, {
      toValue: -6,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(placeholderSize2, {
      toValue: 13,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur2 = () => {
    if (password.trim() === "") {
      Animated.timing(placeholderTop2, {
        toValue: 14,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setFocused2(false));
      Animated.timing(placeholderSize2, {
        toValue: 15,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const styles = StyleSheet.create({
    imgBg: {
      width: "100%",
    },
    all: {
      margin: "10%",
      shadowColor: "#fff",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.8,
      shadowRadius: 40,
    },
    allHolder: {
      padding: "5%",
      borderRadius: Standards.borderRadius,
      backgroundColor: Colors.background,
      borderWidth: 1.5,
      borderColor: Colors.primaryDark,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    loginHeader: {
      fontWeight: "800",
      color: Colors.primaryDark,
      marginBottom: 50,
    },
    inputWrapper: {
      position: "relative",
      width: Math.max(Dimensions.get("window").width - Dimensions.get("window").width * 0.5, 300),
      marginVertical: 10,
      zIndex: 1,
    },
    placeholder: {
      position: "absolute",
      left: 20,
      fontSize: 20,
      color: Colors.primaryDark,
      fontWeight: "600",
      backgroundColor: Colors.background,
      borderRadius: 2,
      zIndex: 0,
    },
    inputField: {
      width: "100%",
      height: 50,
      paddingHorizontal: 20,
      fontSize: 20,
      borderRadius: Standards.borderRadius,
      borderColor: Colors.primaryDark,
      borderWidth: 3,
    },
    button: {
      width: Math.max(Dimensions.get("window").width - Dimensions.get("window").width * 0.5, 300),
      marginVertical: 10,
      backgroundColor: Colors.primaryDark,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: Standards.borderRadius,
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 15,
      paddingVertical: 5,
    },
  });

  async function login() {
    if (!username) setError("Please provide your username.");
    if (!password) setError("Please provide your password.");
    const res = await fetch(settings.walletServer + "/login?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(SHA256(SHA256(password).toString()).toString()));
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    const session = data.session;
    const isWeb = Platform.OS === "web";
    isWeb ? localStorage.setItem("key", SHA256(password).toString()) : await AsyncStorage.setItem("key", SHA256(password).toString());
    isWeb ? localStorage.setItem("session", session) : await AsyncStorage.setItem("session", session);
    router.replace("/(tabs)");
  }

  return (
    <ImageBackground source={require("@/assets/images/branding-multiple-clcs.png")} resizeMode="cover" style={styles.imgBg}>
      <View style={[styles.allHolder, styles.all]}>
        <Texts.Heading style={styles.loginHeader}>Login to Centrix Vault</Texts.Heading>
        <Texts.Medium
          style={{
            color: Colors.textLight,
            marginBottom: 50,
            width: Math.max(Dimensions.get("window").width - Dimensions.get("window").width * 0.5, 300),
            textAlign: "center",
          }}
        >
          Store all your CLC in one place using Centrix Vault!
        </Texts.Medium>

        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.placeholder, { top: placeholderTop, zIndex: focused ? 1 : 2, fontSize: placeholderSize }]}>
            Username
          </Animated.Text>
          <TextInput
            placeholder=""
            placeholderTextColor={Colors.primaryDark}
            style={styles.inputField}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.placeholder, { top: placeholderTop2, zIndex: focused2 ? 1 : 2, fontSize: placeholderSize2 }]}>
            Password
          </Animated.Text>
          <TextInput
            placeholder=""
            placeholderTextColor={Colors.primaryDark}
            style={styles.inputField}
            onFocus={handleFocus2}
            onBlur={handleBlur2}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        <Texts.Regular style={{ color: Colors.danger }}>{error}</Texts.Regular>
      </View>
    </ImageBackground>
  );
}
