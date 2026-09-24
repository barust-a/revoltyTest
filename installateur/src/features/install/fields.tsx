import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '../../ui/theme';
import { Icon, type IconName, Txt } from '../../ui/Txt';
import { INSTALL_STRINGS as STR } from './strings';

// Shared labeled-field component used by the install steps (Client, and the
// step-1 manual serial wrapper reuses `styles.field` from here).

export function Field({
  label,
  required = false,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  icon: IconName;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  error?: string;
  children?: React.ReactNode;
}) {
  const filled = value.trim() !== '';
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Txt variant="label">{label}</Txt>
        <Txt variant="xs" color={required ? 'teal' : 'textMuted'}>
          {required ? STR.step2.required : STR.step2.optional}
        </Txt>
      </View>
      <View style={[styles.inputRow, filled && styles.inputFilled]}>
        <Icon name={icon} size={20} color={filled ? 'teal' : 'textMuted'} />
        <TextInput
          style={styles.inputRowText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={label}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {error !== undefined && (
        <Txt variant="xs" color="danger">
          {error}
        </Txt>
      )}
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  field: { gap: theme.spacing.xs },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  inputRow: {
    minHeight: theme.touch.min,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow,
  },
  inputFilled: { borderColor: theme.colors.teal },
  inputRowText: { flex: 1, fontSize: theme.size.body, color: theme.colors.forest },
});
