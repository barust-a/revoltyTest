import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isValidOptionalEmail, type InstallDraft } from '../../core/install';
import type { System } from '../../core/types';
import { Chip } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useServices } from '../AppProvider';
import { Field, styles as fieldStyles } from './fields';
import { searchClients } from './installView';
import { INSTALL_STRINGS as STR } from './strings';

// -- Step 2 · Client ---------------------------------------------------------

export function StepClient({
  draft,
  update,
  updateClient,
  systems,
  services,
}: {
  draft: InstallDraft;
  update: (patch: Partial<InstallDraft>) => void;
  updateClient: (patch: Partial<InstallDraft['client']>) => void;
  systems: System[];
  services: ReturnType<typeof useServices>;
}) {
  const [query, setQuery] = useState('');
  const [addressFromGps, setAddressFromGps] = useState(false);
  const matches = searchClients(systems, query);

  useEffect(() => {
    if (draft.client.address.trim() !== '') return;
    let cancelled = false;
    void services.location.currentAddress().then((addr) => {
      if (cancelled || addr === null) return;
      updateClient({ address: addr });
      setAddressFromGps(true);
    });
    return () => {
      cancelled = true;
    };
    // Runs once when step 2 mounts (parent only renders Step2 while draft.step === 2).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useLocation = () => {
    void services.location.currentAddress().then((addr) => {
      if (addr !== null) {
        updateClient({ address: addr });
        setAddressFromGps(true);
      }
    });
  };

  return (
    <View style={styles.stepGap}>
      <View style={styles.row}>
        <Chip
          label={STR.step2.modeExisting}
          selected={draft.clientMode === 'existant'}
          onPress={() => update({ clientMode: 'existant' })}
        />
        <Chip
          label={STR.step2.modeNew}
          selected={draft.clientMode === 'nouveau'}
          onPress={() => update({ clientMode: 'nouveau' })}
        />
      </View>

      {draft.clientMode === 'existant' && (
        <View style={fieldStyles.field}>
          <TextInput
            style={styles.inputText}
            value={query}
            onChangeText={setQuery}
            placeholder={STR.step2.searchPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel={STR.step2.searchPlaceholder}
          />
          {matches.map((m) => (
            <Pressable
              key={m.systemId}
              accessibilityRole="button"
              accessibilityLabel={`${m.name} · ${m.city}`}
              onPress={() => {
                updateClient({ name: m.name, address: m.address, phone: m.phone, email: m.email });
                setAddressFromGps(false);
                setQuery('');
              }}
              style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
            >
              <Txt variant="body">{`${m.name} · ${m.city}`}</Txt>
            </Pressable>
          ))}
        </View>
      )}

      <Field
        label={STR.step2.nameLabel}
        required
        icon="person"
        value={draft.client.name}
        onChangeText={(t) => updateClient({ name: t })}
        placeholder={STR.step2.namePlaceholder}
      />

      <Field
        label={STR.step2.addressLabel}
        required
        icon="home"
        value={draft.client.address}
        onChangeText={(t) => {
          setAddressFromGps(false);
          updateClient({ address: t });
        }}
      >
        {addressFromGps && draft.client.address.trim() !== '' && (
          <Txt variant="xs" color="teal">
            {STR.step2.gpsHint}
          </Txt>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={STR.step2.useLocation}
          onPress={useLocation}
          style={({ pressed }) => [styles.useLocationButton, pressed && styles.pressed]}
        >
          <Icon name="my-location" size={18} color="teal" />
          <Txt variant="small" color="teal">
            {STR.step2.useLocation}
          </Txt>
        </Pressable>
      </Field>

      <Field
        label={STR.step2.phoneLabel}
        icon="call"
        value={draft.client.phone}
        onChangeText={(t) => updateClient({ phone: t })}
        placeholder={STR.step2.phonePlaceholder}
        keyboardType="phone-pad"
      />

      <Field
        label={STR.step2.emailLabel}
        icon="mail"
        value={draft.client.email}
        onChangeText={(t) => updateClient({ email: t })}
        placeholder={STR.step2.emailPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        error={!isValidOptionalEmail(draft.client.email) ? STR.step2.invalidEmail : undefined}
      >
        <Txt variant="xs" color="textMuted">
          {STR.step2.emailHint}
        </Txt>
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: theme.spacing.lg },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  pressed: { opacity: 0.7 },
  inputText: {
    minHeight: theme.touch.min,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.size.body,
    color: theme.colors.forest,
    ...theme.shadow,
  },
  resultRow: {
    minHeight: theme.touch.min,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  useLocationButton: {
    minHeight: theme.touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
});
