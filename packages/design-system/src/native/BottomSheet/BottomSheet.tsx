import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { Icon } from '../Icon/Icon.js';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  footer?: ReactNode;
  children: ReactNode;
  /** Sheet height; defaults to content height capped at 78%. */
  height?: number | 'auto';
  /** Scrim opacity, per the design's `dim` prop. */
  dim?: number;
}

/** The one canonical mobile sheet — pickers, asks, and consume flows all use it. */
export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
  height = 'auto',
  dim = 0.5,
}: BottomSheetProps) {
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable
          testID="bottom-sheet-scrim"
          aria-label="Dismiss"
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: `rgba(14,18,14,${String(dim)})` }]}
        />
        {/* Modal itself carries the dialog/aria-modal semantics. */}
        <View style={[styles.sheet, height === 'auto' ? null : { height }]}>
          <View style={styles.grabberRow}>
            <View style={styles.grabber} />
          </View>
          {(title !== undefined || eyebrow !== undefined) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {eyebrow !== undefined && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                {title !== undefined && <Text style={styles.title}>{title}</Text>}
              </View>
              <Pressable aria-label="Close" onPress={onClose} style={styles.close}>
                <Icon name="X" size={14} color={tokens.fgMuted} />
              </Pressable>
            </View>
          )}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          {footer !== undefined && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 54, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    backgroundColor: tokens.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxShadow: '0 -20px 48px rgba(14,18,14,0.20)',
    overflow: 'hidden',
    maxHeight: '78%',
  },
  grabberRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.lineStrong,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.44,
    color: tokens.fg,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.bgSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexShrink: 1 },
  bodyContent: { paddingVertical: 8 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
    backgroundColor: tokens.bg,
  },
});
