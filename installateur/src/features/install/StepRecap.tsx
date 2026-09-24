import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { InstallDraft } from '../../core/install';
import { batteryLabel, parseSerial } from '../../core/serial';
import type { PilotMode } from '../../core/types';
import { theme } from '../../ui/theme';
import { Icon, type IconName, Txt } from '../../ui/Txt';
import { missingContactFields } from './installView';
import { INSTALL_STRINGS as STR } from './strings';

// -- Step 5 · Récapitulatif ---------------------------------------------------

const PILOT_MODE_LABEL: Record<PilotMode, string> = {
  autoconsommation: STR.step3.autoconsommation.title,
  secours: STR.step3.secours.title,
  heures_creuses: STR.step3.heures_creuses.title,
};

export function StepRecap({ draft }: { draft: InstallDraft }) {
  const parsed = parseSerial(draft.serial ?? '');
  const serial = parsed.ok ? parsed.serial : (draft.serial ?? '');
  const missing = missingContactFields(draft.client);

  return (
    <View style={styles.stepGap}>
      <View style={styles.recapSection}>
        <Txt variant="h2">{STR.step5.created}</Txt>
        <RecapRow text={STR.step5.batteryRow(batteryLabel(serial), serial)} />
        <RecapRow text={STR.step5.clientRow(draft.client.name, draft.client.address)} />
        <RecapRow text={STR.step5.modeRow(PILOT_MODE_LABEL[draft.pilotMode])} />
        <RecapRow text={STR.step5.commRow(draft.comm === 'ok')} />
      </View>

      <View style={styles.recapSection}>
        <Txt variant="h2">{STR.step5.later}</Txt>
        {missing.includes('phone') && <LaterRow icon="call" text={STR.step5.phone} />}
        {missing.includes('email') && <LaterRow icon="mail" text={STR.step5.email} />}
        <LaterRow icon="solar-power" text={STR.step5.pvPower} />
        <LaterRow icon="battery-charging-full" text={STR.step5.inverterBrand} />
        <LaterRow icon="photo-camera" text={STR.step5.boardPhotos} />
      </View>
    </View>
  );
}

function RecapRow({ text }: { text: string }) {
  return (
    <View style={styles.recapRow}>
      <Icon name="check-circle" color="teal" />
      <Txt variant="body" style={styles.recapText}>
        {text}
      </Txt>
    </View>
  );
}

function LaterRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.recapRow}>
      <Icon name={icon} color="textMuted" />
      <Txt variant="body" style={styles.recapText}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: theme.spacing.lg },
  recapSection: { gap: theme.spacing.sm },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  recapText: { flex: 1 },
});
