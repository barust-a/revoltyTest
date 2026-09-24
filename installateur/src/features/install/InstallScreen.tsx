import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  canAdvance,
  cityFromAddress,
  emptyDraft,
  INSTALL_STEPS,
  type InstallDraft,
} from '../../core/install';
import { syncOf } from '../../core/sync';
import { Button } from '../../ui/Button';
import { Screen, StepProgress, SubHeader } from '../../ui/Screen';
import { Mascot } from '../../ui/Surfaces';
import { SyncBadge } from '../../ui/SyncBadge';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useAppState, useServices } from '../AppProvider';
import { StepBattery } from './StepBattery';
import { StepClient } from './StepClient';
import { StepComm } from './StepComm';
import { StepMode } from './StepMode';
import { StepRecap } from './StepRecap';
import { stepBackLabel, stepCta, stepHelp, stepLabel } from './installView';
import { INSTALL_STRINGS as STR } from './strings';

export function InstallScreen() {
  const services = useServices();
  const storedDraft = useAppState((s) => s.installDraft);
  const saveInstallDraft = useAppState((s) => s.saveInstallDraft);
  const finishInstall = useAppState((s) => s.finishInstall);
  const systems = useAppState((s) => s.domain.systems);
  const queue = useAppState((s) => s.domain.queue);
  const offline = useAppState((s) => s.offline);

  const [draft, setDraft] = useState<InstallDraft>(() => storedDraft ?? emptyDraft());
  const [resumed, setResumed] = useState(storedDraft !== null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Persisting is a side effect: it runs in an effect after the draft settles, never
  // inside the setDraft updater itself (React forbids store writes mid-render).
  useEffect(() => {
    saveInstallDraft(draft);
  }, [draft, saveInstallDraft]);

  const update = useCallback(
    (patch: Partial<InstallDraft> | ((d: InstallDraft) => Partial<InstallDraft>)) => {
      setDraft((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
    },
    [],
  );

  const updateClient = useCallback(
    (patch: Partial<InstallDraft['client']>) => {
      update((prev) => ({ client: { ...prev.client, ...patch } }));
    },
    [update],
  );

  const handleRestart = () => {
    setDraft(emptyDraft());
    setResumed(false);
  };

  const handleBack = () => {
    if (draft.step === 1) {
      router.back();
      return;
    }
    setHelpOpen(false);
    update((prev) => ({ step: prev.step - 1 }));
  };

  const handlePrimary = () => {
    if (draft.step === 5) {
      const id = finishInstall(draft);
      setCreatedId(id);
      return;
    }
    setHelpOpen(false);
    update((prev) => ({ step: prev.step + 1 }));
  };

  if (createdId !== null) {
    const city = cityFromAddress(draft.client.address);
    const sync = syncOf(queue, createdId);
    return (
      <Screen
        header={<SubHeader onBack={() => router.replace('/')} />}
        dock={
          <View style={styles.successDock}>
            <Button
              label={STR.success.viewSystem}
              onPress={() => router.replace(`/system/${createdId}`)}
              block
            />
            <Button
              label={STR.success.home}
              variant="secondary"
              onPress={() => router.replace('/')}
              block
            />
          </View>
        }
      >
        <View style={styles.hero}>
          <Mascot kind="muscle" />
          <Txt variant="h1" accessibilityRole="header">
            {STR.success.title}
          </Txt>
          <Txt variant="body">{STR.success.subtitle(draft.client.name, city)}</Txt>
          {offline && <Txt variant="small">{STR.success.offline}</Txt>}
          {sync !== null && <SyncBadge sync={sync} />}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <SubHeader
          title={STR.headerTitle}
          backLabel={stepBackLabel(draft.step)}
          onBack={handleBack}
        >
          <StepProgress count={INSTALL_STEPS} current={draft.step} />
          <View style={styles.stepRow}>
            <Txt variant="meta" color="onTeal" style={styles.stepRowLabel}>
              {stepLabel(draft.step)}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={STR.help}
              onPress={() => setHelpOpen((o) => !o)}
              style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
            >
              <Icon name="help" size={20} color="onTeal" />
              <Txt variant="strong" color="onTeal">
                {STR.help}
              </Txt>
            </Pressable>
          </View>
          {helpOpen && (
            <Txt variant="body" color="onTealMuted">
              {stepHelp(draft.step)}
            </Txt>
          )}
        </SubHeader>
      }
      dock={
        <Button
          label={stepCta(draft.step)}
          onPress={handlePrimary}
          disabled={!canAdvance(draft)}
          size="xl"
          block
        />
      }
    >
      {resumed && (
        <View style={styles.resumedBanner}>
          <Icon name="history" color="teal" />
          <View style={styles.resumedText}>
            <Txt variant="strong" color="teal">
              {STR.resumedTitle}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={STR.resumedRestart}
              onPress={handleRestart}
            >
              <Txt variant="strong" color="teal" style={styles.underline}>
                {STR.resumedRestart}
              </Txt>
            </Pressable>
          </View>
        </View>
      )}

      {draft.step === 1 && <StepBattery draft={draft} update={update} services={services} />}
      {draft.step === 2 && (
        <StepClient
          draft={draft}
          update={update}
          updateClient={updateClient}
          systems={systems}
          services={services}
        />
      )}
      {draft.step === 3 && <StepMode draft={draft} update={update} />}
      {draft.step === 4 && (
        <StepComm draft={draft} update={update} services={services} offline={offline} />
      )}
      {draft.step === 5 && <StepRecap draft={draft} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stepRowLabel: { flex: 1 },
  helpButton: {
    minHeight: theme.touch.min,
    minWidth: theme.touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  pressed: { opacity: 0.7 },
  resumedBanner: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: theme.colors.mintStrong,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  resumedText: { flex: 1, gap: theme.spacing.xxs },
  underline: { textDecorationLine: 'underline' },
  hero: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl },
  successDock: { gap: theme.spacing.sm },
});
