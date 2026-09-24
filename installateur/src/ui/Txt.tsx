import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { theme, type ThemeColor } from './theme';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Decorative by default: meaning is always carried by an adjacent text label.
export function Icon({
  name,
  size = 24,
  color = 'forest',
  testID,
}: {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  testID?: string;
}) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={theme.colors[color]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export type TxtVariant = 'h1' | 'h2' | 'h3' | 'label' | 'strong' | 'body' | 'meta' | 'small' | 'xs';

export function Txt({
  variant = 'body',
  color,
  numeric,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; color?: ThemeColor; numeric?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        styles[variant],
        color !== undefined && { color: theme.colors[color] },
        numeric === true && styles.numeric,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: theme.font.display,
    fontSize: theme.size.h1,
    lineHeight: 32,
    color: theme.colors.forest,
  },
  h2: {
    fontFamily: theme.font.display,
    fontSize: theme.size.h2,
    lineHeight: 27,
    color: theme.colors.teal,
  },
  h3: {
    fontFamily: theme.font.display,
    fontSize: theme.size.h3,
    lineHeight: 24,
    color: theme.colors.forest,
  },
  label: {
    fontFamily: theme.font.bold,
    fontSize: theme.size.label,
    lineHeight: 24,
    color: theme.colors.forest,
  },
  strong: {
    fontFamily: theme.font.bold,
    fontSize: theme.size.body,
    lineHeight: 23,
    color: theme.colors.forest,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.size.body,
    lineHeight: 24,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: theme.font.regular,
    fontSize: theme.size.body,
    lineHeight: 24,
    color: theme.colors.textMuted,
  },
  small: {
    fontFamily: theme.font.semibold,
    fontSize: theme.size.sm,
    lineHeight: 20,
    color: theme.colors.text,
  },
  xs: {
    fontFamily: theme.font.semibold,
    fontSize: theme.size.xs,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  numeric: { fontVariant: ['tabular-nums'] },
});
