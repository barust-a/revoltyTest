import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from './theme';

// Dumb component: props only — no store access, no ports.
export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  label: { color: theme.colors.onAccent, fontSize: theme.font.body, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
