import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { InstallDraft } from '../../core/install';
import type { PilotMode } from '../../core/types';
import { OptionRow } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { INSTALL_STRINGS as STR } from './strings';

// -- Step 3 · Mode de pilotage ------------------------------------------------

export const PILOT_OPTIONS: { mode: PilotMode; title: string; description: string }[] = [
  { mode: 'autoconsommation', ...STR.step3.autoconsommation },
  { mode: 'secours', ...STR.step3.secours },
  { mode: 'heures_creuses', ...STR.step3.heures_creuses },
];

export function StepMode({
  draft,
  update,
}: {
  draft: InstallDraft;
  update: (patch: Partial<InstallDraft>) => void;
}) {
  return (
    <View style={styles.stepGap}>
      {PILOT_OPTIONS.map((opt) => (
        <OptionRow
          key={opt.mode}
          title={opt.title}
          description={opt.description}
          selected={draft.pilotMode === opt.mode}
          onPress={() => update({ pilotMode: opt.mode })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: theme.spacing.lg },
});
