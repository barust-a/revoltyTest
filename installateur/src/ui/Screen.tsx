import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UI_STRINGS } from './strings';
import { theme } from './theme';
import { Icon, Txt } from './Txt';

// Page scaffold: teal header (rounded bottom corners), scrollable body, optional bottom dock
// for the single primary action (never in a corner, never hidden behind the OS home bar).
export function Screen({
  header,
  children,
  dock,
  refreshControl,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  dock?: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>{header}</View>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
      {dock !== undefined && (
        <View style={[styles.dock, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
          {dock}
        </View>
      )}
    </View>
  );
}

export function SubHeader({
  title,
  backLabel,
  onBack,
  children,
}: {
  title?: string;
  backLabel?: string;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.sub}>
      <View style={styles.subRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel ?? UI_STRINGS.back}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={28} color="white" />
          <Txt variant="strong" color="white">
            {backLabel ?? UI_STRINGS.back}
          </Txt>
        </Pressable>
        {title !== undefined && (
          <Txt variant="h3" color="white" style={styles.subTitle} numberOfLines={1}>
            {title}
          </Txt>
        )}
      </View>
      {children}
    </View>
  );
}

export function StepProgress({ count, current }: { count: number; current: number }) {
  return (
    <View
      style={styles.steps}
      accessibilityLabel={`Étape ${current} sur ${count}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.step,
            i + 1 < current && styles.stepDone,
            i + 1 === current && styles.stepCurrent,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
    borderBottomLeftRadius: theme.radius.header,
    borderBottomRightRadius: theme.radius.header,
  },
  body: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 18,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  dock: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  sub: { gap: theme.spacing.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  back: {
    minHeight: theme.touch.min,
    minWidth: theme.touch.min,
    paddingRight: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -theme.spacing.sm,
  },
  subTitle: { flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.7 },
  steps: { flexDirection: 'row', gap: 6, marginTop: theme.spacing.sm },
  step: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
  stepDone: { backgroundColor: theme.colors.primary },
  stepCurrent: { backgroundColor: theme.colors.white },
});
