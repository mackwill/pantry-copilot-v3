import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { Icon, type IconName } from '../Icon/Icon.js';

export interface MobileTabBarItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface MobileTabBarProps {
  items: MobileTabBarItem[];
  active: string;
  onPress?: ((id: string) => void) | undefined;
}

/** Bottom tab bar; items come from the app (no routing dependency here). */
export function MobileTabBar({ items, active, onPress }: MobileTabBarProps) {
  return (
    <View role="tablist" style={styles.bar}>
      {items.map((item) => {
        const selected = item.id === active;
        const color = selected ? tokens.accent : tokens.fgSubtle;
        return (
          <Pressable
            key={item.id}
            role="tab"
            aria-selected={selected}
            onPress={() => onPress?.(item.id)}
            style={styles.tab}
          >
            <Icon name={item.icon} size={20} color={color} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: tokens.bgRaised,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
