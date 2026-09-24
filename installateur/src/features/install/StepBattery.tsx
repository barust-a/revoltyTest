import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { InstallDraft } from '../../core/install';
import { batteryLabel, parseSerial } from '../../core/serial';
import { Button } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useServices } from '../AppProvider';
import { showInvalidSerialHint } from './installView';
import { INSTALL_STRINGS as STR } from './strings';

const VIEWFINDER_HEIGHT = 300;

// -- Step 1 · Batterie ------------------------------------------------------

export function StepBattery({
  draft,
  update,
  services,
}: {
  draft: InstallDraft;
  update: (patch: Partial<InstallDraft>) => void;
  services: ReturnType<typeof useServices>;
}) {
  const [manualEntry, setManualEntry] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const parsed = parseSerial(draft.serial ?? '');
  const ScannerView = services.scanner.View;

  return (
    <View style={styles.stepGap}>
      <Txt variant="strong">{STR.step1.caption}</Txt>

      {!manualEntry && (
        <>
          <View style={styles.viewfinder}>
            <ScannerView
              onScanned={(code) => {
                const p = parseSerial(code);
                if (p.ok) {
                  update({ serial: p.serial });
                  setScanMessage(null);
                } else {
                  setScanMessage(STR.step1.scanInvalid);
                }
              }}
              onUnavailable={() => {
                setManualEntry(true);
                setScanMessage(STR.step1.cameraUnavailable);
              }}
            />
            <View pointerEvents="none" style={styles.viewfinderFrame} />
          </View>
          {scanMessage !== null && (
            <Txt variant="small" color="danger">
              {scanMessage}
            </Txt>
          )}
          <Button
            variant="secondary"
            icon="keyboard"
            label={STR.step1.manualButton}
            onPress={() => setManualEntry(true)}
            block
          />
        </>
      )}

      {manualEntry && (
        <View style={styles.field}>
          <TextInput
            style={styles.inputText}
            value={draft.serial ?? ''}
            onChangeText={(t) => update({ serial: t })}
            autoCapitalize="characters"
            placeholder={STR.step1.placeholder}
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel={STR.step1.manualLabel}
          />
          {scanMessage !== null && (
            <Txt variant="xs" color="offlineText">
              {scanMessage}
            </Txt>
          )}
          {showInvalidSerialHint(draft.serial) && (
            <Txt variant="xs" color="danger">
              {STR.step1.invalidFormat}
            </Txt>
          )}
        </View>
      )}

      {parsed.ok && (
        <View style={styles.foundCard}>
          <Icon name="check-circle" color="teal" />
          <View>
            <Txt variant="label" color="teal">
              {batteryLabel(parsed.serial)}
            </Txt>
            <Txt variant="meta">{STR.step1.serialLabel(parsed.serial)}</Txt>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: theme.spacing.lg },
  viewfinder: {
    height: VIEWFINDER_HEIGHT,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.viewfinder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderFrame: {
    position: 'absolute',
    width: '70%',
    height: '45%',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  field: { gap: theme.spacing.xs },
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
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.card,
    borderWidth: 2,
    borderColor: theme.colors.teal,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
  },
});
