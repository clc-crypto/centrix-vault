import Wallet from "@/types/wallet";
import settings from "./settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import CryptoJS from "crypto-es";

export default async function loadWallet(): Promise<null | Wallet> {
  try {
    console.log("Fetching wallet...");
    const isWeb = Platform.OS === "web";
    let session: string | null = isWeb ? localStorage.getItem("session") : await AsyncStorage.getItem("session");
    let key: string | null = isWeb ? localStorage.getItem("key") : await AsyncStorage.getItem("key");
    if (!session || !key) {
      return null;
    }

    const res = await fetch(`${settings.walletServer}/get-data?session=${encodeURIComponent(session)}&nc=${Math.random()}`);

    if (!res.ok) {
      console.log("[ERROR] Fetch to get wallet, returned bad status: " + res.status);
      return null;
    }

    const json = await res.json();
    const wallet = json.wallet as Wallet;

    await Promise.all(wallet.coins.map(async (coin, i) => {
      wallet.coins[i].privateKey = await decryptAES(coin.privateKey, key);
    }));

    return wallet;
  } catch (e: any) {
    console.log("[ERROR] Fetch to get wallet: " + e.message);
    return null;
  }
}

export async function saveWallet(wallet: Wallet): Promise<string | null> {
  try {
    console.log("Saving wallet...");
    const isWeb = Platform.OS === "web";
    let session: string | null = isWeb ? localStorage.getItem("session") : await AsyncStorage.getItem("session");
    let key: string | null = isWeb ? localStorage.getItem("key") : await AsyncStorage.getItem("key");
    if (!session || !key) {
      return "Session or key not found, please emergency-save your wallet,\n" + JSON.stringify(wallet);
    }

    await Promise.all(wallet.coins.map(async (coin, i) => {
      wallet.coins[i].privateKey = await encryptAES(coin.privateKey, key);
    }));

    const res = await fetch(`${settings.walletServer}/set-data?session=${encodeURIComponent(session)}&wallet=${encodeURIComponent(JSON.stringify(wallet))}`);
    if (!res.ok) {
      console.log("[ERROR] Fetch to get wallet, returned bad status: " + res.status);
      return "Could not save your wallet, please emergency-save your wallet,\n" + JSON.stringify(wallet, null, 2);
    }
    return null;
  } catch (e: any) {
    console.log("[ERROR] Fetch to get wallet: " + e.message);
    return "A JS error occured! " + e.message;
  }
}

function getAESKey(key: string) {
  return CryptoJS.SHA256(key).toString();
}

function encryptAES(plaintext: string, key: string): string {
  const hashedKey = getAESKey(key);
  const ciphertext = CryptoJS.AES.encrypt(plaintext, hashedKey).toString();
  return ciphertext;
}

function decryptAES(ciphertext: string, key: string): string {
  const hashedKey = getAESKey(key);
  const bytes = CryptoJS.AES.decrypt(ciphertext, hashedKey);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return plaintext;
}