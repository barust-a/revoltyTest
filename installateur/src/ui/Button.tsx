import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from './theme';
import { Icon, type IconName, Txt } from './Txt';

// Dumb components: props only — no store access, no ports.
// Every touchable is ≥ 56 dp (gloves); no long-press, no swipe.

type ButtonVariant = 'primary' | 'secondary' | 'yellow' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  block = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'xl';
  icon?: IconName;
  disabled?: boolean;
  block?: boolean;
}) {
  const inkColor = disabled ? 'offlineText' : variant === 'ghost' ? 'teal' : 'forest';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'xl' && styles.xl,
        block && styles.block,
        disabled ? styles.disabled : variantStyles[variant],
        pressed && styles.pressed,
      ]}
    >
      {icon !== undefined && <Icon name={icon} color={inkColor} />}
      <Txt variant={size === 'xl' ? 'label' : 'strong'} color={inkColor}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function ChoiceButton({
  label,
  icon,
  tone,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  tone: 'ok' | 'ko';
  selected: boolean;
  onPress: () => void;
}) {
  const on = selected ? (tone === 'ok' ? styles.choiceOk : styles.choiceKo) : null;
  const ink = selected && tone === 'ko' ? 'danger' : 'forest';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, on, pressed && styles.pressed]}
    >
      <Icon name={icon} size={32} color={ink} />
      <Txt variant="label" color={ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}
    >
      {selected ? (
        <Icon name="check-circle" size={22} color="teal" />
      ) : (
        icon !== undefined && <Icon name={icon} size={22} color="teal" />
      )}
      <Txt variant="strong">{label}</Txt>
    </Pressable>
  );
}

export function OptionRow({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionOn,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={styles.optionText}>
        <Txt variant="label">{title}</Txt>
        {description !== undefined && <Txt variant="small">{description}</Txt>}
      </View>
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderBottomColor: theme.colors.primaryShadow,
    borderBottomWidth: 4,
  },
  secondary: { backgroundColor: theme.colors.card, borderColor: theme.colors.forest },
  yellow: { backgroundColor: theme.colors.yellow, borderColor: theme.colors.yellow },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
});

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touch.min,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.card,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  xl: { minHeight: theme.touch.dock, borderRadius: 18 },
  block: { alignSelf: 'stretch' },
  disabled: { backgroundColor: theme.colors.offlineBar, borderColor: theme.colors.offlineBar },
  pressed: { opacity: 0.75 },
  choice: {
    flex: 1,
    minHeight: theme.touch.choice,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    ...theme.shadow,
  },
  choiceOk: { backgroundColor: theme.colors.primary, borderColor: theme.colors.forest },
  choiceKo: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.danger,
    borderWidth: 3,
  },
  chip: {
    minHeight: theme.touch.min,
    paddingHorizontal: 18,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow,
  },
  chipOn: { backgroundColor: theme.colors.mintStrong, borderColor: theme.colors.teal },
  option: {
    minHeight: theme.touch.dock,
    borderRadius: theme.radius.card,
    borderWidth: 2,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadow,
  },
  optionOn: { borderColor: theme.colors.teal, backgroundColor: theme.colors.mintStrong },
  optionText: { flex: 1, gap: theme.spacing.xxs },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: theme.colors.teal },
  radioDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.teal },
});
