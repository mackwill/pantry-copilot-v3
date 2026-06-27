import { Icon } from '@pantry/design-system/native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScanAsset } from '../useScanFlow';
import { scanStrings } from '../strings';
import { SAMPLE_IMAGE_BASE64, scanTheme } from './scanTheme';

const SAMPLE_ASSET: ScanAsset = { base64: SAMPLE_IMAGE_BASE64, mediaType: 'image/jpeg' };

interface ViewfinderStepProps {
  onCapture: (asset: ScanAsset) => void;
  onClose: () => void;
}

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

export function ViewfinderStep({ onCapture, onClose }: ViewfinderStepProps) {
  const [permission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const cameraReady = permission?.granted === true;
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  const shoot = () => {
    void (async () => {
      if (cameraReady && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        if (photo.base64 !== undefined) {
          onCapture({ base64: photo.base64, mediaType: 'image/jpeg' });
          return;
        }
      }
      onCapture(SAMPLE_ASSET);
    })();
  };

  return (
    <View style={styles.root}>
      {cameraReady ? (
        <CameraView
          testID="scan-camera"
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={flash}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.scene]}>
          {scanTheme.sceneItems.map((s, i) => (
            <View
              key={i}
              style={{ position: 'absolute', top: s.top, left: s.left, width: s.width, height: s.height, borderRadius: 8, backgroundColor: s.color, opacity: 0.25 }}
            />
          ))}
        </View>
      )}

      <View style={styles.topBar}>
        <Pressable testID="scan-close" onPress={onClose} hitSlop={8} style={styles.circle}>
          <Icon name="X" size={18} color={scanTheme.textOnDark} />
        </Pressable>
        <View style={styles.badge}>
          <Icon name="ScanLine" size={11} color={scanTheme.textOnDark} />
          <Text style={styles.badgeText}>{scanStrings.viewfinder.badge}</Text>
        </View>
        <Pressable
          testID="scan-flash"
          onPress={() => { setFlash((on) => !on); }}
          hitSlop={8}
          style={styles.circle}
        >
          <Icon name="Zap" size={16} color={flash ? scanTheme.reticle : scanTheme.textOnDark} />
        </Pressable>
      </View>

      <View style={styles.hint}>
        <View style={styles.hintPill}>
          <Icon name="Refrigerator" size={13} color={scanTheme.textOnDark} />
          <Text style={styles.hintText}>{scanStrings.viewfinder.hint}</Text>
        </View>
      </View>

      <View style={styles.reticle}>
        {CORNERS.map((c) => (
          <View key={c} style={[styles.corner, cornerStyles[c]]} />
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable testID="scan-use-sample" onPress={() => { onCapture(SAMPLE_ASSET); }} style={styles.sideControl}>
          <Icon name="Image" size={20} color={scanTheme.textOnDark} />
        </Pressable>
        <Pressable testID="scan-shutter" onPress={shoot} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <Pressable
          testID="scan-flip"
          onPress={() => { setFacing((cur) => (cur === 'back' ? 'front' : 'back')); }}
          style={styles.sideControl}
        >
          <Icon name="RefreshCw" size={18} color={scanTheme.textOnDark} />
        </Pressable>
      </View>
    </View>
  );
}

const cornerStyles = StyleSheet.create({
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: scanTheme.bg, paddingTop: 54 },
  scene: { top: 54, backgroundColor: '#12160F' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  circle: { width: 36, height: 36, borderRadius: 999, backgroundColor: scanTheme.glass, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: scanTheme.textOnDark, fontSize: 12, fontWeight: '500' },
  hint: { position: 'absolute', top: '12%', left: 0, right: 0, alignItems: 'center' },
  hintPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  hintText: { color: scanTheme.textOnDark, fontSize: 12, fontWeight: '500' },
  reticle: { position: 'absolute', top: '28%', alignSelf: 'center', width: 280, height: 340 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: scanTheme.reticle },
  controls: { position: 'absolute', bottom: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  sideControl: { width: 44, height: 44, borderRadius: 10, backgroundColor: scanTheme.glassStrong, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: { width: 74, height: 74, borderRadius: 999, backgroundColor: '#fff', padding: 5, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  shutterInner: { flex: 1, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: scanTheme.bg },
});
