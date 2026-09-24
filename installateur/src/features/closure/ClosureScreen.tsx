import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { syncOf } from '../../core/sync';
import { formatClock } from '../../core/time';
import { MANIP_VERB } from '../../core/todo';
import type { NextStep } from '../../core/types';
import { Button, ChoiceButton, Chip, OptionRow } from '../../ui/Button';
import { Card, IconPastille, Mascot, SectionTitle } from '../../ui/Surfaces';
import { Screen, SubHeader } from '../../ui/Screen';
import { SyncBadge } from '../../ui/SyncBadge';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useAppState, useServices } from '../AppProvider';
import { MANIP_VISUAL } from '../shared';
import {
  actionsFor,
  batteryStatusLabel,
  buildClosureInput,
  confirmationTitle,
  nextRecapLabel,
  toggleAction,
} from './closureView';
import { CLOSURE_STRINGS } from './strings';

// A photo grid, min 120 dp so it stays comfortable to tap with gloves (spec §3.4 D).
const PHOTO_MIN_HEIGHT = 120;
const PHOTO_SLOTS = [0, 1] as const;

export function ClosureScreen({ manipId }: { manipId: string }) {
  const services = useServices();
  const offline = useAppState((s) => s.offline);
  const manip = useAppState((s) => s.domain.manips.find((m) => m.id === manipId));
  const system = useAppState((s) =>
    manip === undefined ? undefined : s.domain.systems.find((sys) => sys.id === manip.systemId),
  );
  const queue = useAppState((s) => s.domain.queue);
  const openManip = useAppState((s) => s.openManip);
  const closeManip = useAppState((s) => s.closeManip);
  const retrySync = useAppState((s) => s.retrySync);

  const [arrivedAt] = useState(() => services.clock.now().toISOString());
  const [result, setResult] = useState<'resolu' | 'pas_resolu' | null>(null);
  const [next, setNext] = useState<NextStep>('repasser');
  const [actions, setActions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null]);
  const [note, setNote] = useState<string | undefined>(undefined);
  const [audioMemo, setAudioMemo] = useState<string | undefined>(undefined);
  const [dictating, setDictating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    openManip(manipId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manipId]);

  if (manip === undefined || system === undefined) {
    return (
      <Screen header={<SubHeader onBack={() => router.back()} />}>
        <Txt variant="h2">{CLOSURE_STRINGS.notFoundTitle}</Txt>
      </Screen>
    );
  }

  const visual = MANIP_VISUAL[manip.type];
  const verb = MANIP_VERB[manip.type];

  function handleAddPhoto(index: number) {
    if (photos[index] !== null) return;
    void services.capture.takePhoto(index + 1).then((uri) => {
      if (uri === null) return;
      setPhotos((prev) => prev.map((p, i) => (i === index ? uri : p)));
    });
  }

  async function handleDictate() {
    setDictating(true);
    const captured = await services.capture.dictate(!offline);
    setDictating(false);
    if (captured.note !== undefined) {
      setNote(captured.note);
      setAudioMemo(undefined);
    } else if (captured.audioMemo !== undefined) {
      setAudioMemo(captured.audioMemo);
      setNote(undefined);
    }
  }

  function handleClose() {
    if (result === null) return;
    closeManip(
      buildClosureInput({
        manipId,
        result,
        next,
        actions,
        photos: photos.filter((p): p is string => p !== null),
        note,
        audioMemo,
        arrivedAt,
      }),
    );
    setSubmitted(true);
  }

  const lastAttempt = manip.attempts[manip.attempts.length - 1];
  const sync = lastAttempt === undefined ? null : syncOf(queue, lastAttempt.id);
  const queueItem =
    lastAttempt === undefined ? undefined : queue.find((q) => q.refId === lastAttempt.id);
  const battery =
    manip.alertId !== null && lastAttempt?.result === 'resolu'
      ? batteryStatusLabel(manip.status)
      : null;

  return (
    <Screen
      header={
        <SubHeader title={`${system.client.name} · ${system.city}`} onBack={() => router.back()}>
          <View style={styles.headerRow}>
            <IconPastille icon={visual.icon} tone={visual.tone} />
            <View style={styles.headerCol}>
              <Txt variant="label" color="white">
                {verb}
              </Txt>
              <Txt variant="meta" color="onTealMuted">
                {CLOSURE_STRINGS.arrivedAt(formatClock(arrivedAt))}
              </Txt>
            </View>
          </View>
        </SubHeader>
      }
      dock={
        submitted ? (
          <Button
            label={CLOSURE_STRINGS.backHome}
            variant="primary"
            size="xl"
            block
            onPress={() => router.replace('/')}
          />
        ) : (
          <Button
            label={CLOSURE_STRINGS.closeCta}
            variant="primary"
            size="xl"
            block
            disabled={result === null}
            onPress={handleClose}
          />
        )
      }
    >
      {submitted ? (
        <>
          <View style={styles.hero}>
            <Mascot kind="bravo" size={120} />
            <Txt variant="h2">{confirmationTitle(offline)}</Txt>
            <Txt variant="meta">{`${verb} · ${system.client.name}`}</Txt>
          </View>
          <Card style={styles.stack}>
            {sync !== null && (
              <SyncBadge
                sync={sync}
                onRetry={queueItem === undefined ? undefined : () => retrySync(queueItem.id)}
              />
            )}
            {battery !== null && (
              <View style={styles.statusRow}>
                <Icon
                  name={manip.status === 'cloturee' ? 'check-circle' : 'hourglass-top'}
                  color={manip.status === 'cloturee' ? 'teal' : 'textMuted'}
                />
                <Txt variant="body">{battery}</Txt>
              </View>
            )}
            {lastAttempt?.result === 'pas_resolu' && lastAttempt.next !== undefined && (
              <Txt variant="body">{nextRecapLabel(lastAttempt.next)}</Txt>
            )}
          </Card>
          <Button
            label={CLOSURE_STRINGS.viewSystem}
            variant="secondary"
            block
            onPress={() => router.replace(`/system/${manip.systemId}`)}
          />
        </>
      ) : (
        <>
          <View style={styles.stack}>
            <SectionTitle title={CLOSURE_STRINGS.resultTitle} />
            <View style={styles.resultRow}>
              <ChoiceButton
                label={CLOSURE_STRINGS.resolved}
                icon="check-circle"
                tone="ok"
                selected={result === 'resolu'}
                onPress={() => setResult('resolu')}
              />
              <ChoiceButton
                label={CLOSURE_STRINGS.notResolved}
                icon="cancel"
                tone="ko"
                selected={result === 'pas_resolu'}
                onPress={() => setResult('pas_resolu')}
              />
            </View>
          </View>

          {result === 'pas_resolu' && (
            <View style={styles.stack}>
              <SectionTitle title={CLOSURE_STRINGS.nextTitle} />
              <OptionRow
                title={CLOSURE_STRINGS.repasser}
                description={CLOSURE_STRINGS.repasserDetail}
                selected={next === 'repasser'}
                onPress={() => setNext('repasser')}
              />
              <OptionRow
                title={CLOSURE_STRINGS.transmettre}
                description={CLOSURE_STRINGS.transmettreDetail}
                selected={next === 'transmettre_revolty'}
                onPress={() => setNext('transmettre_revolty')}
              />
            </View>
          )}

          <View style={styles.stack}>
            <SectionTitle title={CLOSURE_STRINGS.whatIDid} />
            <View style={styles.chipRow}>
              {actionsFor(manip.type).map((action) => (
                <Chip
                  key={action}
                  label={action}
                  selected={actions.includes(action)}
                  onPress={() => setActions((prev) => toggleAction(prev, action))}
                />
              ))}
              <Chip
                label={CLOSURE_STRINGS.otherChip}
                icon="add"
                selected={actions.includes(CLOSURE_STRINGS.otherAction)}
                onPress={() =>
                  setActions((prev) => toggleAction(prev, CLOSURE_STRINGS.otherAction))
                }
              />
            </View>
          </View>

          <View style={styles.stack}>
            <SectionTitle title={CLOSURE_STRINGS.photos} />
            <View style={styles.photoGrid}>
              {PHOTO_SLOTS.map((index) => {
                const uri = photos[index];
                if (uri !== null && uri !== undefined) {
                  return (
                    <View
                      key={index}
                      style={styles.photoThumb}
                      accessible
                      accessibilityLabel={CLOSURE_STRINGS.photoLabel(index + 1)}
                    >
                      <Icon name="image" size={32} color="teal" />
                      <Txt variant="small">{CLOSURE_STRINGS.photoLabel(index + 1)}</Txt>
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    accessibilityLabel={CLOSURE_STRINGS.addPhoto}
                    onPress={() => handleAddPhoto(index)}
                    style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}
                  >
                    <Icon name="photo-camera" size={32} color="teal" />
                    <Txt variant="small" color="teal">
                      {CLOSURE_STRINGS.addPhoto}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.stack}>
            <SectionTitle title={CLOSURE_STRINGS.note} />
            {dictating && <Txt variant="meta">{CLOSURE_STRINGS.listening}</Txt>}
            {!dictating && note !== undefined && <Txt variant="body">{note}</Txt>}
            {!dictating && note === undefined && audioMemo !== undefined && (
              <Txt variant="meta">{CLOSURE_STRINGS.audioMemoNote}</Txt>
            )}
            <Button
              label={CLOSURE_STRINGS.dictate}
              icon="mic"
              variant="secondary"
              block
              disabled={dictating}
              onPress={() => void handleDictate()}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  headerCol: { gap: theme.spacing.xxs },
  stack: { gap: theme.spacing.md },
  resultRow: { flexDirection: 'row', gap: theme.spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  photoGrid: { flexDirection: 'row', gap: theme.spacing.md },
  photoAdd: {
    flex: 1,
    minHeight: PHOTO_MIN_HEIGHT,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  photoThumb: {
    flex: 1,
    minHeight: PHOTO_MIN_HEIGHT,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.mintStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  pressed: { opacity: 0.75 },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
});
