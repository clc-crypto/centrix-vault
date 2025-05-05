import React, { useEffect, useState, useRef, useCallback } from "react";
import Alert from "@/components/Alert";
import Balance from "@/components/Balance";
import Texts from "@/components/Texts";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  RefreshControl
} from "react-native";
import EC from "elliptic";
import { Colors } from "@/components/Theme";
import { TransactionRecord, WalletCoin } from "@/types/wallet";
import loadWallet, { saveWallet } from "@/components/Wallet";
import settings from "@/components/settings";

const ec = new EC.ec("secp256k1");

export default function Index() {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);
  const [alert, setAlert] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const balanceRef = useRef(null);
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);
  const [coins, setCoins] = useState<WalletCoin[]>([]);
  const [downloadedCoins, setDownloadedCoins] = useState<Record<number, any>>({});

  const refreshWallet = async () => {
    setRefreshing(true);
    const wallet = await loadWallet();
    console.log(wallet)
    if (!wallet) {
      setRefreshing(false);
      return;
    }

    setTxHistory(wallet.transactionRecord);
    setCoins(wallet.coins || []);
    if (wallet.coins.length === 0) {
      setRefreshing(false);
      return;
    }
    try {
      const res = await fetch(settings.centrixServer + "/coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: wallet.coins.map(coin => coin.id) })
      });

      if (!res.ok) {
        setAlert("Error fetching balance! Status code: " + res.status);
        setRefreshing(false);
        return;
      }

      const data = await res.json();
      setDownloadedCoins(data);
    } catch (e) {
      setAlert("Failed to fetch coin data.");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    refreshWallet();
    let fetching = false;
    const i = setInterval(async () => {
      if (fetching) return;
      fetching = true;
      await refreshWallet();
      fetching = false;
    }, 10000);

    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setWindowWidth(window.width);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription.remove();
  }, []);

  const styles = StyleSheet.create({
    transactionHistoryWrapper: {
      padding: 15,
      width: windowWidth,
      display: "flex",
      alignItems: "center"
    },
    transactionHistory: {
      width: Math.min(windowWidth - 30, 800),
      flexGrow: 1
    },
    transaction: {
      borderBottomColor: Colors.border,
      borderBottomWidth: 1.5,
      paddingVertical: 10
    },
    transactionRow: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    coinList: {
      marginTop: 30,
      width: Math.min(windowWidth - 30, 800)
    },
    coin: {
      borderBottomColor: Colors.border,
      borderBottomWidth: 1.5,
      paddingVertical: 10
    }
  });

  if (alert) {
    console.log("Alert " + alert);
    return <Alert title="An Error Occured!" message={alert} onResolved={() => {}} onlyOk />;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshWallet} />
      }
    >
      <View ref={balanceRef}>
        <Balance />
      </View>
      <View style={styles.transactionHistoryWrapper}>
        <Texts.Regular style={{ color: Colors.textLight, alignSelf: "flex-start", marginLeft: windowWidth - 30 < 800 ? 0 : (windowWidth - 800 - 30) / 2 }}>
          Transaction History
        </Texts.Regular>
        <View style={styles.transactionHistory}>
          {[...txHistory].reverse().map((tx, index) => (
            <TouchableOpacity
              key={index}
              onPress={() =>
                Linking.openURL(`https://clc-crypto.github.io/coin?id=${tx.id}&height=${tx.height}`)
              }
              style={styles.transaction}
            >
              <View style={styles.transactionRow}>
                <Texts.Medium
                  style={{
                    color: tx.amount > 0 ? Colors.primary : Colors.danger,
                    fontWeight: "900"
                  }}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount} CLC
                </Texts.Medium>
                <Texts.Medium>
                  {tx.amount > 0 ? "Incoming" : "Outgoing"}
                </Texts.Medium>
              </View>
              <View style={styles.transactionRow}>
                <Texts.Small style={{ fontWeight: "900" }}>
                  ID: <Texts.Medium style={{ color: Colors.primary }}>{tx.id}</Texts.Medium>
                </Texts.Small>
                <Texts.Small style={{ fontWeight: "900" }}>
                  HEIGHT: <Texts.Medium style={{ color: Colors.primary }}>{tx.height}</Texts.Medium>
                </Texts.Small>
              </View>
            </TouchableOpacity>
          ))}
          {txHistory.length !== 0 ||
            <Texts.Medium style={{ fontWeight: "700", color: Colors.textLight }}>
              Nothing here yet...
            </Texts.Medium>
          }
        </View>

        <View style={styles.coinList}>
          <Texts.Regular style={{ color: Colors.textLight, alignSelf: "flex-start" }}>
            Your Coins
          </Texts.Regular>
          {coins.map((coin, index) => (
            <TouchableOpacity key={index} style={styles.coin} onPress={() =>
              Linking.openURL(`https://clc-crypto.github.io/coin?id=${coin.id}`)
            }>
              <Texts.Small style={{ fontWeight: "900" }}>
                COIN ID: <Texts.Medium style={{ color: Colors.primary }}>{coin.id}</Texts.Medium>
              </Texts.Small>
              <Texts.Small style={{ fontWeight: "900" }}>
                COIN VALUE: <Texts.Medium style={{ color: Colors.primary }}>
                  {downloadedCoins[coin.id] ? Math.round(downloadedCoins[coin.id].val * 1000) / 1000 : ""}
                </Texts.Medium> CLC
              </Texts.Small>
              <Texts.Small numberOfLines={1} style={{ fontWeight: "900" }}>
                PUBLIC KEY: <Texts.Medium ellipsizeMode="tail" style={{ color: Colors.primary, fontWeight: "400", overflow: "hidden" }}>
                  {coin.privateKey ? ec.keyFromPrivate(coin.privateKey, "hex").getPublic().encode("hex", false) : ""}
                </Texts.Medium>
              </Texts.Small>
            </TouchableOpacity>
          ))}
          {coins.length !== 0 ||
            <Texts.Medium style={{ fontWeight: "700", color: Colors.textLight }}>
              Nothing here yet...
            </Texts.Medium>
          }
        </View>
      </View>
    </ScrollView>
  );
}
