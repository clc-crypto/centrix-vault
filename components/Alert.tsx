import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Colors, Standards } from "./Theme";

type Props = {
  title: string;
  message: string;
  onResolved: (confirmed: boolean) => void; // true for OK, false for Cancel
  onlyOk?: boolean;
};

export default function Alert({
  title,
  message,
  onResolved,
  onlyOk = false
}: Props) {
  const [visible, setVisible] = useState(true);

  const handleOk = () => {
    setVisible(false);
    onResolved(true);
  };

  const handleCancel = () => {
    setVisible(false);
    onResolved(false);
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {!onlyOk && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.okButton} onPress={handleOk}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 1000,
    elevation: 1000
  },
  alertBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxWidth: 400,
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignSelf: "stretch",
    gap: 10
  },
  okButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Standards.borderRadius
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold"
  },
  cancelButton: {
    backgroundColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold"
  }
});
