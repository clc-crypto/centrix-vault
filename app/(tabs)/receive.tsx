import Alert from "@/components/Alert";
import Balance from "@/components/Balance";
import Texts from "@/components/Texts";
import { Colors, Standards } from "@/components/Theme";
import loadWallet, { saveWallet } from "@/components/Wallet";
import CentrixClient from "centrix-sdk";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';

const cc = new CentrixClient();

export default function Receive() {
  const { width } = useWindowDimensions();

  const styles = StyleSheet.create({
    all: {
      display: "flex",
      alignItems: "center",
      marginTop: 100,
    },
    amount: {
      width: width > 900 ? "30%" : "70%",
      height: 100,
      fontSize: 40,
      fontWeight: 700,
      borderBottomColor: Colors.primary,
      borderBottomWidth: 3,
      textAlign: "center",
    },
    prepareButton: {
      width: width > 900 ? "30%" : "70%",
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
    receiver: {
      width: "90%",
      padding: 10,
      borderBottomColor: Colors.primary,
      borderBottomWidth: 3,
      textAlign: "center",
      fontWeight: 700,
    },
    addressGroup: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      width: "90%",
      justifyContent: "space-evenly"
    },
    qrContainer: {

    }
  });

  const [ready, setReady] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [priv, setPriv] = useState("");
  const [id, setId] = useState("");
  const [invalidSession, setInvalidSession] = useState(false);
  const [error, setError] = useState("");

  const pressingAbortRef = useRef(false);
  
  useEffect(() => {
    (async () => {
      const wallet = await loadWallet();
      if (!wallet) return setInvalidSession(true);

      if (wallet.currentTx) {
        setPriv(wallet.currentTx.privateKey);
        setId(wallet.currentTx.id.toString());
        setReceiving(true);
      }

      setReady(true);
    })();
  }, []);

  useEffect(() => { // Make ID numeric
    if (!id) return;
    // Replace comma with dot for decimal point
    let cleaned = id.replace(/[^0-9,\.]/g, ''); 
    cleaned = cleaned.replace(',', '.'); // Change first comma to dot if present
    const parts = cleaned.split('.'); 
    
    // If there are multiple dots (or commas), keep only the first one
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setId(parseInt(cleaned).toString());
  }, [id]);

  async function receive() {
    for (let i = 0; i < 2; i++) setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100 * i);
    if (!id) return;
    const priv = cc.randomKey();
    console.log("err")
    setPriv(priv);

    const wallet = await loadWallet();
    if (!wallet) return setError("Error fetching wallet!");
    wallet.currentTx = {
      id: parseInt(id),
      privateKey: priv
    };
    const err = await saveWallet(wallet);
    if (err) return setError(err);
    setReceiving(true);
  }

  async function abort() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const wallet = await loadWallet();
    if (!wallet) return setError("Error fetching wallet!");
    wallet.currentTx = null;
    const err = await saveWallet(wallet);
    if (err) return setError(err);
    setReceiving(false);
    setId("");
    setReady(true);
    setPriv("");
  }

  async function refresh() {
    console.log("waiting...")
    const coin = await cc.getCoin(parseInt(id));
    if (typeof coin === "string") return setError(coin);

    if (coin.transactions[coin.transactions.length - 1].holder !== cc.publicKey(priv)) return;

    const wallet = await loadWallet();
    if (!wallet) return setError("Error fetching wallet!");
    wallet.currentTx = null;

    wallet.coins.push({
      id: parseInt(id),
      privateKey: priv
    });

    wallet.transactionRecord.push({
      amount: coin.val,
      id: parseInt(id),
      height: coin.transactions.length
    });

    const err = await saveWallet(wallet);
    if (err) return setError(err);
    setReceiving(false);
    setId("");
    setReady(true);
    setPriv("");
    router.replace("/(tabs)");
  }

  const intervalRef = useRef<null | number>(null);

  useEffect(() => {
    if (!receiving) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      refresh();
    }, 3000);
  }, [receiving]);

  if (invalidSession) return <Alert onlyOk title="Logged Out" message="You have been logged out. This could have happened, because you logged in from a diffrent location. Please log in again." onResolved={() => router.replace("/login")} />
  if (error) return <Alert onlyOk title="An Error Occured" message={error} onResolved={() => router.replace("/(tabs)")} />

  if (receiving) return (
    <ScrollView>
      <Balance />
      <View style={styles.all}>
        <Texts.Large>Receiving <Texts.Large style={{ color: Colors.primary, fontWeight: 700 }}>CLC</Texts.Large></Texts.Large>
        <Texts.Large style={{ textAlign: "center", fontWeight: 700, marginVertical: 25 }}>Transaction ID: <Texts.Large style={{ color: Colors.primary }}>{id}</Texts.Large></Texts.Large>
        <View style={styles.qrContainer}>
          <QRCode
            size={width > 900 ? width * 0.3 : width * 0.7}
            value={cc.publicKey(priv)}
            color={Colors.primary}
            logo={require("@/assets/images/logo.png")}
            logoBorderRadius={50}
            logoSize={100}
            backgroundColor={Colors.background}
          />
        </View>
        <Texts.Medium style={{ marginTop: 20, fontWeight: 700 }}>Your Receiving Address</Texts.Medium>
        <Texts.Medium ellipsizeMode="middle" numberOfLines={1} style={{ marginTop: 20, fontWeight: 400, color: Colors.primary, borderBottomColor: Colors.primary, borderBottomWidth: 2, paddingHorizontal: 30, width: "90%", textAlign: "center" }}>{cc.publicKey(priv)}</Texts.Medium>
        <TouchableOpacity style={styles.prepareButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Clipboard.setStringAsync(cc.publicKey(priv));
        }}>
          <Texts.Regular style={styles.buttonText}>Copy Address</Texts.Regular>
        </TouchableOpacity>
        <TouchableOpacity style={styles.prepareButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          refresh();
        }}>
          <Texts.Regular style={styles.buttonText}>Refresh</Texts.Regular>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.prepareButton, { backgroundColor: Colors.danger }]}
          onPressIn={() => {
            pressingAbortRef.current = true;
            let time = 100;
            function repeated() {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              if (pressingAbortRef.current) {
                setTimeout(repeated, time);
                time /= 2;
              }
            }
            repeated();
          }}
          onPressOut={() => {
            pressingAbortRef.current = false;
          }}
          onLongPress={() => {
            pressingAbortRef.current = false;
            abort();
          }}
        >
          <Texts.Regular style={styles.buttonText}>Abort Transaction</Texts.Regular>
        </TouchableOpacity>
        <Texts.Small style={{ textAlign: "center" }}>Long press to abort</Texts.Small>
      </View>
    </ScrollView>
  ) 

  if (ready) return (
    <ScrollView>
    <Balance />
    <View style={styles.all}>
      <Texts.Large>Receive <Texts.Large style={{ color: Colors.primary, fontWeight: 700 }}>CLC</Texts.Large></Texts.Large>
      <Texts.Medium style={{ marginTop: 20, fontWeight: 700 }}>Transaction ID</Texts.Medium>
      <TextInput keyboardType="numeric" style={styles.amount} placeholder="#0" placeholderTextColor={Colors.textLight} value={id} onChangeText={num => setId(num)} />
      <TouchableOpacity style={styles.prepareButton} onPress={receive}>
        <Texts.Regular style={styles.buttonText}>Receive</Texts.Regular>
      </TouchableOpacity>
    </View>
  </ScrollView>
  ) 
}
