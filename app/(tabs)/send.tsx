import Balance from "@/components/Balance";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useEffect, useState } from "react";
import Wallet from "@/types/wallet";
import loadWallet, { saveWallet } from "@/components/Wallet";
import Alert from "@/components/Alert";
import { router } from "expo-router";
import Texts from "@/components/Texts";
import { Colors, Standards } from "@/components/Theme";
import { Camera, CameraView } from 'expo-camera';
import Icon from "react-native-vector-icons/Ionicons";
import * as Clipboard from 'expo-clipboard';

import CentrixClient from "centrix-sdk";
const cc = new CentrixClient();

export default function Send() {
  const [ready, setReady] = useState(false);
  const [invalidSession, setInvalidSession] = useState(false);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState<null | Wallet>(null);
  const [id, setId] = useState(0);
  const [amount, setAmount] = useState<null | string>(null);
  const [notEnoughFunds, setNotEnoughFunds] = useState(false);
  const [badAddr, setBadAddr] = useState(false);
  const [receiver, setReceiver] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [camPermission, setCamPermission] = useState(false);

  useEffect(() => {
    if (!amount) return;
    // Replace comma with dot for decimal point
    let cleaned = amount.replace(/[^0-9,\.]/g, ''); 
    cleaned = cleaned.replace(',', '.'); // Change first comma to dot if present
    const parts = cleaned.split('.'); 
    
    // If there are multiple dots (or commas), keep only the first one
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setAmount(cleaned);
  }, [amount]);  

  const styles = StyleSheet.create({
    all: {
      display: "flex",
      alignItems: "center",
      marginTop: 100,
    },
    amount: {
      width: Dimensions.get("window").width > 900 ? "30%" : "70%",
      height: 100,
      fontSize: 40,
      fontWeight: 700,
      borderBottomColor: Colors.primary,
      borderBottomWidth: 3,
      textAlign: "center",
    },
    prepareButton: {
      width: Dimensions.get("window").width > 900 ? "30%" : "70%",
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
    }
  });

  useEffect(() => {
    (async () => {
      const wallet = await loadWallet();
      setWallet(wallet);
      if (!wallet) return setInvalidSession(true);

      setReady(true);

      const { status } = await Camera.requestCameraPermissionsAsync();
      setCamPermission(status === 'granted');
    })();
  }, []);

  async function splitCoins() {
    if (!wallet) return;
    if (!amount) return;
    if (id) return;

    let wal = await loadWallet();

    if (!wal) return setError("Could not fetch wallet!");

    while (wal.coins.length > 1) {
      const coin = wal.coins[0];
      const coinTo = wal.coins[1];
      console.log("Merge " + coin.id + " into " + coinTo.id);
      console.log(JSON.stringify(wal.coins, null, 2));
      if (!coin) break;
      if (!coinTo) break;

      const originCoin = await cc.getCoin(coin.id);
      if (typeof originCoin === "string") return setError(originCoin);

      const mergeErr = await cc.merge(coin.id, coinTo.id, originCoin.val, coin.privateKey);

      if (mergeErr) return setError(mergeErr + "Please emergency save wallet: " + wal + " and report to the centrix development team.");
      wal.coins.shift();
    }

    const err = await saveWallet(wal);
    if (err) setError(err);

    const w = await loadWallet();
    console.log("Wallet to split:", w);
    if (!w) return setError("Could not load wallet!");
    setWallet(w);

    for (const coin of w.coins) {
      const dCoin = await cc.getCoin(coin.id);
      if (typeof dCoin === "string") return setError(dCoin);
      if (dCoin.val < parseFloat(amount)) continue;
      
      if (dCoin.val === parseFloat(amount)) return setId(coin.id);

      console.log("Splitting coin #" + coin.id);
      const splitRes = await cc.split(coin.id, parseFloat(amount), coin.privateKey);
      if (typeof splitRes === "string") return setError(splitRes);
      w.coins.push(
        {
          id: splitRes,
          privateKey: coin.privateKey
        }
      );

      const err = await saveWallet(w);
      if (err) setError(err);

      setId(splitRes);
      setWallet(w);
      return;
    } 
    setNotEnoughFunds(true);
  }

  async function send() {
    if (!id) return;
    if (!amount) return;
    if (!receiver) return;
    const wallet = await loadWallet();
    if (!wallet) return setError("Could not load wallet!");
    const wCoin = wallet.coins.find(c => c.id === id);
    if (!wCoin) return;
    // if (receiver.length !== 130) {
    //   setBadAddr(true);
    //   return;
    // }
    const res = await cc.transact(wCoin.privateKey, id, receiver);

    if (res) return setError(res);
    
    const i = wallet.coins.findIndex(c => c === wCoin);
    wallet.coins.splice(i, 1);

    // Get tx height
    const resH = await cc.getCoin(id);
    if (typeof resH === "string") return setError(resH);

    wallet.transactionRecord.push({
      amount: -amount,
      id,
      height: resH.transactions.length
    });
    const err = await saveWallet(wallet);
    if (err) return setError(err);
    setScanning(false);
    setId(0);
    setReceiver("");
    setAmount("");
    setWallet(await loadWallet());
    router.replace("/(tabs)");
  }

  if (invalidSession) return <Alert onlyOk title="Logged Out" message="You have been logged out. This could have happened, because you logged in from a diffrent location. Please log in again." onResolved={() => router.replace("/login")} />
  if (error) return <Alert onlyOk title="An Error Occured" message={error} onResolved={() => router.replace("/(tabs)")} />
  if (notEnoughFunds) return <Alert onlyOk title="Not Enough Funds" message="Sorry, you do not have enough unlocked funds to complete this transaction." onResolved={() => setNotEnoughFunds(false)} />
  if (badAddr) return <Alert onlyOk title="Warning" message="The receiver address you provided is invalid." onResolved={() => setBadAddr(false)} />


  if (!ready) return (
    <ScrollView style={{ flex: 1 }}>
      <Balance />
      <Texts.Large style={{ textAlign: "center" }}>Loading...</Texts.Large>
    </ScrollView>
  );

  if (scanning && camPermission) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            zIndex: 1
          }}
          onPress={() => Clipboard.setStringAsync(id + "")}
        >
          <Texts.Regular style={{ color: 'white', fontSize: 18 }}>TX <Texts.Regular style={{ color: Colors.primary }}>#{id}</Texts.Regular></Texts.Regular>
        </TouchableOpacity>
        <CameraView
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={{ ...StyleSheet.absoluteFillObject, flex: 1 }}
          onBarcodeScanned={result => {
            setReceiver(result.data);
            setScanning(false);
          }}
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
          }}
          onPress={() => setScanning(false)}
        >
          <Texts.Regular style={{ color: 'white', fontSize: 18 }}>Cancel</Texts.Regular>
        </TouchableOpacity>
      </View>
    )
  }

  if (id) {
    return (
      <ScrollView>
        <Balance noinvalid />
        <View style={styles.all}>
          <Texts.Large>Send <Texts.Large style={{ color: Colors.primary, fontWeight: 700 }}>{amount} CLC</Texts.Large></Texts.Large>
          <Texts.Large style={{ textAlign: "center", fontWeight: 700, marginVertical: 25 }}>Transaction ID: <Texts.Large style={{ color: Colors.primary }}>{id}</Texts.Large></Texts.Large>
          <Texts.Medium style={{ marginTop: 20, fontWeight: 700 }}>Receiver's Address</Texts.Medium>
          <View style={styles.addressGroup}>
            <TextInput style={styles.receiver} placeholder="Receiver's address" placeholderTextColor={Colors.textLight} value={receiver} onChangeText={r => setReceiver(r)} maxLength={150} />
            {(camPermission && Platform.OS === "web") ||
              <TouchableOpacity onPress={() => setScanning(true)}>
                <Icon size={40} name="barcode-outline"></Icon>
              </TouchableOpacity>
            }
          </View>
          <TouchableOpacity style={styles.prepareButton} onPress={send}>
            <Texts.Regular style={styles.buttonText}>Send</Texts.Regular>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView>
      <Balance />
      <View style={styles.all}>
        <Texts.Large>Send <Texts.Large style={{ color: Colors.primary, fontWeight: 700 }}>CLCs</Texts.Large></Texts.Large>
        <Texts.Medium style={{ marginTop: 20, fontWeight: 700 }}>Transaction Amount</Texts.Medium>
        <TextInput keyboardType="decimal-pad" style={styles.amount} placeholder="0 CLC" placeholderTextColor={Colors.textLight} value={amount ? amount : ""} onChangeText={num => setAmount(num)} />
        <TouchableOpacity style={styles.prepareButton} onPress={splitCoins}>
          <Texts.Regular style={styles.buttonText}>Split Coins</Texts.Regular>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
