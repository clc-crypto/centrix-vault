import { Text, View, StyleSheet } from "react-native";
import { Colors } from "@/components/Theme";
import Texts from "./Texts";
import { useEffect, useState } from "react";
import loadWallet, { saveWallet } from "./Wallet";
import Alert from "./Alert";
import { router } from "expo-router";
import settings from "./settings";
import EC from "elliptic";

const ec = new EC.ec("secp256k1");
type Props = {
  noinvalid?: true
}


export default function Balance(props: Props) {
  const [alert, setAlert] = useState<{ alert: string, resolved: (ok: boolean) => void } | null>(null);
  const [balance, setBalance] = useState<number | string>("---");
  const [centracted, setCentracted] = useState(false);
  const [invalidSession, setInvalidSession] = useState(false);

  useEffect(() => {
    let interval: number;

    let fetching = false;
    const fetchBalance = async () => {
      if (fetching) return;
      fetching = true;
      const wallet = await loadWallet();
      if (!wallet) {
        setInvalidSession(true);
        return;
      }
      if (wallet.coins.length === 0) return setBalance(0);

      try {
        const res = await fetch(settings.centrixServer + "/coins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ids: wallet.coins.map(coin => coin.id) })
        });

        if (!res.ok) {
          setAlert({ alert: "Error fetching balance! Status code: " + res.status, resolved: ok => {} });
          return;
        }

        const coins = await res.json();
        let balance = 0;
        let hasCentracted = false;
        for (const coin of wallet.coins) {
          balance += coins[coin.id].val;
          if (coins[coin.id].transactions.at(-1)?.centract) {
            hasCentracted = true;
          }

          if (!props.noinvalid && ec.keyFromPrivate(coin.privateKey).getPublic().encode("hex", false) !== coins[coin.id].transactions[coins[coin.id].transactions.length - 1].holder) {
            setAlert({ alert: "Warning coin #" + coin.id + " is invalid! Do you wish to remove it?", resolved: async ok => {
              if (ok) {
                for (const c in wallet.coins) {
                  if (wallet.coins[c] === coin) {
                    wallet.coins.splice(parseInt(c), 1);
                  }
                }
                await saveWallet(wallet);
              }
              setAlert(null);
            }});
          }
          if (coins[coin.id].val === 0) {
            for (const c in wallet.coins) {
              if (wallet.coins[c] === coin) {
                wallet.coins.splice(parseInt(c), 1);
              }
            }
            await saveWallet(wallet);
          }
        }
        setCentracted(hasCentracted);
        setBalance(Math.round(balance * 1000) / 1000);
      } catch (err: any) {
        setAlert({ alert: "Error fetching balance: " + err, resolved: () => {} });
      }
    };

    fetchBalance(); // fetch immediately on mount
    interval = setInterval(async () => {fetchBalance(); fetching = false; } , 10000); // repeat every 10s

    return () => clearInterval(interval); // clean up on unmount
  }, []);

  if (invalidSession) {
    console.log("Invalid session!");
    return (
      <Alert
        title="Logged Out"
        message="You have been logged out, or you have reset your browser cookies. Please log in again."
        onResolved={() => router.replace("/login")}
        onlyOk
      />
    );
  }

  if (alert) {
    console.log("Alert " + alert);
    return (
      <Alert
        title="An Error Occurred!"
        message={alert.alert}
        onResolved={alert.resolved}
      />
    );
  }

  return (
    <View style={styles.all}>
      <View style={styles.balancePanel}>
        <Texts.Small>Balance</Texts.Small>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.balanceText,
            centracted ? { color: Colors.warn } : {}
          ]}
        >
          {balance}
          <Text style={styles.balanceTextCurrency}>CLC</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    marginTop: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  balancePanel: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center"
  },
  balanceText: {
    fontSize: 50,
    fontWeight: "bold",
    textAlign: "center",
    includeFontPadding: false
  },
  balanceTextCurrency: {
    color: Colors.primary
  }
});
