import React from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme, type ThemeColor } from './theme';
import { Icon, type IconName, Txt } from './Txt';

export function Card({
  children,
  onPress,
  accessibilityLabel,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress === undefined) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const PASTILLE_BG: Record<'yellow' | 'mint' | 'teal' | 'red', ThemeColor> = {
  yellow: 'yellow',
  mint: 'mintStrong',
  teal: 'tealSoft',
  red: 'dangerSoft',
};

export function IconPastille({ icon, tone }: { icon: IconName; tone: keyof typeof PASTILLE_BG }) {
  return (
    <View style={[styles.pastille, { backgroundColor: theme.colors[PASTILLE_BG[tone]] }]}>
      <Icon name={icon} color={tone === 'red' ? 'danger' : 'forest'} />
    </View>
  );
}

const BANNER: Record<
  'offline' | 'danger' | 'info',
  { bg: ThemeColor; ink: ThemeColor; icon: IconName }
> = {
  offline: { bg: 'offlineBar', ink: 'offlineInk', icon: 'cloud-off' },
  danger: { bg: 'dangerBg', ink: 'danger', icon: 'error' },
  info: { bg: 'mintStrong', ink: 'forest', icon: 'info' },
};

export function Banner({
  tone,
  title,
  detail,
  icon,
}: {
  tone: keyof typeof BANNER;
  title: string;
  detail?: string;
  icon?: IconName;
}) {
  const b = BANNER[tone];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: theme.colors[b.bg] }]}
    >
      <Icon name={icon ?? b.icon} color={b.ink} />
      <View style={styles.fill}>
        <Txt variant="strong" color={b.ink}>
          {title}
        </Txt>
        {detail !== undefined && <Txt variant="body">{detail}</Txt>}
      </View>
    </View>
  );
}

const MASCOTS = {
  cool: require('../../assets/img/mascotte-cool.jpg'),
  bravo: require('../../assets/img/mascotte-bravo.jpg'),
  muscle: require('../../assets/img/mascotte-muscle.jpg'),
} as const;

// Brand mascot from revolty.fr — only in "breathing moments", never on a working screen.
export function Mascot({ kind, size = 96 }: { kind: keyof typeof MASCOTS; size?: number }) {
  return (
    <Image
      source={MASCOTS[kind]}
      accessibilityIgnoresInvertColors
      style={[styles.mascot, { width: size, height: size, borderRadius: size / 3.7 }]}
    />
  );
}

export function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionTitle}>
      <Txt variant="h2" accessibilityRole="header">
        {title}
      </Txt>
      {count !== undefined && (
        <View style={styles.count}>
          <Txt variant="strong" color="teal" numeric>
            {count}
          </Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
  pressed: { opacity: 0.8 },
  pastille: {
    width: theme.touch.pastille,
    height: theme.touch.pastille,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: theme.radius.md,
  },
  fill: { flex: 1, gap: theme.spacing.xxs },
  mascot: { backgroundColor: theme.colors.white },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  count: {
    backgroundColor: theme.colors.mintStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 2,
  },
});
