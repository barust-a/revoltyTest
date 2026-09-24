import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { InstallDraft } from '../../core/install';
import { parseSerial } from '../../core/serial';
import { Button } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useServices } from '../AppProvider';
import { INSTALL_STRINGS as STR } from './strings';

// -- Step 4 · Test de communication ------------------------------------------

export function StepComm({
  draft,
  update,
  services,
  offline,
}: {
  draft: InstallDraft;
  update: (patch: Partial<InstallDraft>) => void;
  services: ReturnType<typeof useServices>;
  offline: boolean;
}) {
  const [phase, setPhase] = useState<'running' | 'failed'>('running');

  // Fires the test without touching state synchronously (state changes only happen
  // once the async result comes back) so it is safe to call from the mount effect.
  const startTest = useCallback(() => {
    const parsed = parseSerial(draft.serial ?? '');
    if (!parsed.ok) return;
    void services.commTest.run(parsed.serial, !offline).then((res) => {
      if (res.ok) update({ comm: 'ok', commSocPct: res.socPct });
      else setPhase('failed');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.serial, offline]);

  useEffect(() => {
    if (draft.comm === null) startTest();
    // Only re-run automatically on arrival at the step (spec: "si comm est null").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryTest = () => {
    setPhase('running');
    startTest();
  };

  return (
    <View style={styles.stepGap}>
      {draft.comm === null && phase === 'running' && (
        <View style={styles.testCard}>
          <Txt variant="label">{STR.step4.runningTitle}</Txt>
          <Txt variant="meta">{STR.step4.runningDetail}</Txt>
          <Button
            variant="secondary"
            label={STR.step4.skip}
            onPress={() => update({ comm: 'skipped' })}
            block
          />
        </View>
      )}

      {draft.comm === null && phase === 'failed' && (
        <View style={styles.testCard}>
          <Icon name="cloud-off" color="offlineText" size={32} />
          <Txt variant="label">{STR.step4.failTitle}</Txt>
          <Button
            variant="secondary"
            icon="refresh"
            label={STR.step4.retry}
            onPress={retryTest}
            block
          />
          <Button
            variant="ghost"
            label={STR.step4.skip}
            onPress={() => update({ comm: 'skipped' })}
            block
          />
        </View>
      )}

      {draft.comm === 'ok' && (
        <View style={styles.foundCard}>
          <Icon name="check-circle" color="teal" />
          <Txt variant="label" color="teal">
            {STR.step4.successLabel(draft.commSocPct ?? 0)}
          </Txt>
        </View>
      )}

      {draft.comm === 'skipped' && (
        <View style={styles.card}>
          <Icon name="add-task" color="forest" />
          <Txt variant="meta">{STR.step4.skippedMention}</Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: theme.spacing.lg },
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
  testCard: {
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderRadius: theme.radius.card,
    borderWidth: 2,
    borderColor: theme.colors.line,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
});
