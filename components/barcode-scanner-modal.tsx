import Ionicons from "@expo/vector-icons/Ionicons";
import { BarcodeScanningResult, Camera, CameraView } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BarcodeScannerModalProps = {
  visible: boolean;
  colors: any;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
};

export default function BarcodeScannerModal({
  visible,
  colors,
  onClose,
  onBarcodeScanned,
}: BarcodeScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);

    // バーコードがスキャンされたら、商品名として使用
    Alert.alert(
      "バーコード検出",
      `バーコード: ${data}\n\nこのバーコードを商品名として使用しますか？`,
      [
        {
          text: "キャンセル",
          style: "cancel",
          onPress: () => {
            setScanned(false);
          },
        },
        {
          text: "続行",
          onPress: () => {
            onBarcodeScanned(data);
            setScanned(false);
          },
        },
      ],
    );
  };

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  if (hasPermission === null) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
            <Text style={styles.messageText}>カメラの権限を確認中...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
            <Ionicons name="camera-outline" size={64} color={colors.icon} />
            <Text
              style={[
                styles.messageText,
                { color: colors.text, marginTop: 16 },
              ]}
            >
              カメラへのアクセスが許可されていません
            </Text>
            <Text style={[styles.subMessageText, { color: colors.icon }]}>
              このアプリでバーコードをスキャンするには、カメラの権限を許可する必要があります。
            </Text>
            <Text style={[styles.subMessageText, { color: colors.icon }]}>
              設定 → プライバシー → カメラ から権限を許可してください。
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.tint }]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
              "code93",
              "itf14",
            ],
          }}
        >
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButtonTop}
                onPress={handleClose}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>バーコードスキャン</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Scanning Frame */}
            <View style={styles.scanningFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                バーコードを枠内に合わせてスキャン
              </Text>
            </View>

            {/* Bottom Info */}
            <View style={styles.bottomInfo}>
              <Text style={styles.bottomText}>JAN/EAN/QRコードに対応</Text>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  closeButtonTop: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  scanningFrame: {
    position: "absolute",
    top: "40%",
    left: "10%",
    width: "80%",
    height: 200,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
  },
  instructions: {
    position: "absolute",
    top: "55%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomInfo: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    width: "80%",
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subMessageText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
