import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ScannerPort, ScannerViewProps } from '../ports/device';
import { theme } from '../ui/theme';

// Real camera scan of the battery label. Any refusal or failure hands over to manual entry.
function CameraScanner({ onScanned, onUnavailable }: ScannerViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const reported = useRef(false);

  useEffect(() => {
    if (permission === null || permission.granted) return;
    const giveUp = () => {
      if (!reported.current) {
        reported.current = true;
        onUnavailable();
      }
    };
    if (permission.canAskAgain) {
      requestPermission()
        .then((p) => {
          if (!p.granted) giveUp();
        })
        .catch(giveUp);
    } else {
      giveUp();
    }
  }, [permission, requestPermission, onUnavailable]);

  if (permission?.granted !== true) return <View style={styles.box} />;
  return (
    <CameraView
      style={styles.box}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'datamatrix'] }}
      onBarcodeScanned={({ data }) => onScanned(data)}
      onMountError={onUnavailable}
    />
  );
}

export function createCameraScanner(): ScannerPort {
  return { View: CameraScanner };
}

const styles = StyleSheet.create({
  box: { flex: 1, backgroundColor: theme.colors.viewfinder },
});
