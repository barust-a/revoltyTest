import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { dayVerdict, detectAnomalyStart } from '../../core/energy';
import { activeAlertsFor, deriveHealth, HEALTH_LABEL } from '../../core/health';
import {
  addDays,
  formatAgo,
  formatDayShort,
  formatDue,
  formatSinceDetailed,
  localDayKey,
} from '../../core/time';
import { MANIP_VERB } from '../../core/todo';
import type { HealthStatus } from '../../core/types';
import { Button } from '../../ui/Button';
import { HealthIcon, healthBoxStyle } from '../../ui/HealthBadge';
import { Screen, SubHeader } from '../../ui/Screen';
import { Card, IconPastille } from '../../ui/Surfaces';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useAppState, useNow, useServices } from '../AppProvider';
import { MANIP_VISUAL } from '../shared';
import { SYSTEM_STRINGS } from './strings';
import {
  firstAlertWithoutOpenManip,
  ongoingManipsFor,
  openManipForAlert,
  resolvedAlertsFor,
  SEVERITY_VISUAL,
  verdictCardLines,
} from './systemView';

const MEASURES_WINDOW_DAYS = 30;

export function SystemScreen({ systemId }: { systemId: string }) {
  const now = useNow();
  const services = useServices();
  const system = useAppState((s) => s.domain.systems.find((sys) => sys.id === systemId));
  const alerts = useAppState((s) => s.domain.alerts);
  const manips = useAppState((s) => s.domain.manips);
  const createManipFromAlert = useAppState((s) => s.createManipFromAlert);
  const [resolvedOpen, setResolvedOpen] = useState(false);

  const todayKey = localDayKey(now.toISOString());
  const yesterdayKey = addDays(todayKey, -1);

  if (system === undefined) return null;

  // The adapter memoizes per (system, pilotMode, lastMeasureAt, window): cheap to call on every render.
  const measures = services.measures.forSystem(
    system,
    addDays(todayKey, -MEASURES_WINDOW_DAYS),
    now.toISOString(),
  );

  const health = deriveHealth(system, alerts, now);
  const box = healthBoxStyle(health.status);
  const activeAlerts = activeAlertsFor(system.id, alerts);
  const resolvedAlerts = resolvedAlertsFor(system.id, alerts);
  const ongoingManips = ongoingManipsFor(system.id, manips);
  const nextAlertForButton = firstAlertWithoutOpenManip(system.id, alerts, manips);

  const verdict = dayVerdict(measures, yesterdayKey, system.pilotMode);
  const anomalyStart =
    verdict.kind === 'anormal'
      ? detectAnomalyStart(measures, yesterdayKey, system.pilotMode)
      : null;
  const dataLines = verdictCardLines({
    kind: verdict.kind,
    title: verdict.title,
    detail: verdict.detail,
    dayKey: yesterdayKey,
    anomalyStartDayLabel: anomalyStart === null ? null : formatDayShort(anomalyStart),
  });

  const phone = system.client.phone;

  return (
    <Screen
      header={
        <SubHeader
          backLabel={SYSTEM_STRINGS.backLabel}
          onBack={() => router.back()}
          title={SYSTEM_STRINGS.title}
        >
          <View style={styles.headerClient}>
            <Txt variant="h1" color="white">
              {system.client.name}
            </Txt>
            <Txt variant="body" color="onTealMuted">
              {system.client.address}
            </Txt>
          </View>
        </SubHeader>
      }
    >
      <Card style={styles.idCard}>
        <IconPastille icon="battery-full" tone="mint" />
        <View style={styles.fill}>
          <Txt variant="label" numeric>
            {SYSTEM_STRINGS.serial(system.serial)}
          </Txt>
          <Txt variant="meta" color="textMuted">
            {system.batteryLabel}
          </Txt>
        </View>
      </Card>

      <View style={[styles.statusBox, box]}>
        <HealthIcon status={health.status} size={32} />
        <View style={styles.fill}>
          <Txt variant="h3" color={healthInk(health.status)}>
            {HEALTH_LABEL[health.status]}
          </Txt>
          {health.reason !== null && <Txt variant="label">{health.reason}</Txt>}
          {system.lastMeasureAt !== null && (
            <Txt variant="small" color="textMuted">
              {SYSTEM_STRINGS.lastData(formatAgo(system.lastMeasureAt, now))}
            </Txt>
          )}
          {system.configuration === 'non_verifiee' && (
            <View style={styles.unverifiedBadge}>
              <Txt variant="xs" color="offlineText">
                {SYSTEM_STRINGS.unverifiedBadge}
              </Txt>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <View style={styles.fill}>
          <Button
            label={SYSTEM_STRINGS.callClient}
            icon="call"
            variant="secondary"
            disabled={phone === undefined}
            onPress={() => {
              if (phone !== undefined) void Linking.openURL(`tel:${phone}`);
            }}
          />
        </View>
        <View style={styles.fill}>
          <Button
            label={SYSTEM_STRINGS.createManip}
            icon="add-task"
            variant="secondary"
            disabled={nextAlertForButton === null}
            onPress={() => {
              if (nextAlertForButton !== null) createManipFromAlert(nextAlertForButton.id);
            }}
          />
        </View>
      </View>
      {nextAlertForButton === null && (
        <Txt variant="xs" color="textMuted">
          {activeAlerts.length > 0
            ? SYSTEM_STRINGS.allAlertsHandled
            : SYSTEM_STRINGS.noAlertToHandle}
        </Txt>
      )}

      <View style={styles.stack}>
        <Txt variant="h2" accessibilityRole="header">
          {SYSTEM_STRINGS.whatIsWrongTitle}
        </Txt>
        {activeAlerts.length === 0 ? (
          <Card>
            <Txt variant="body">{SYSTEM_STRINGS.nothingToReport}</Txt>
          </Card>
        ) : (
          activeAlerts.map((alert) => {
            const severity = SEVERITY_VISUAL[alert.severity];
            const linkedManip = openManipForAlert(alert.id, manips);
            return (
              <Card key={alert.id}>
                <View style={styles.alertHead}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: theme.colors[severity.color] },
                    ]}
                  >
                    <Txt variant="xs" color="white">
                      {severity.label}
                    </Txt>
                  </View>
                </View>
                <Txt variant="label">{alert.title}</Txt>
                <Txt variant="meta" style={styles.since}>
                  {formatSinceDetailed(alert.since, now)}
                </Txt>
                <View style={[styles.block, styles.blockYellow]}>
                  <View style={styles.blockTitle}>
                    <Icon name="home" size={20} />
                    <Txt variant="strong">{SYSTEM_STRINGS.forClient}</Txt>
                  </View>
                  <Txt variant="body">{alert.clientImpact}</Txt>
                </View>
                <View style={[styles.block, styles.blockMint]}>
                  <View style={styles.blockTitle}>
                    <Icon name="checklist" size={20} />
                    <Txt variant="strong">{SYSTEM_STRINGS.toCheckOnSite}</Txt>
                  </View>
                  {alert.checks.map((check) => (
                    <Txt key={check} variant="body">
                      · {check}
                    </Txt>
                  ))}
                </View>
                {linkedManip !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={SYSTEM_STRINGS.linkedManip(
                      MANIP_VERB[linkedManip.type],
                      linkedManip.dueAt === null ? '' : formatDue(linkedManip.dueAt, now),
                    )}
                    onPress={() => router.push(`/manip/${linkedManip.id}/close`)}
                    style={styles.linkRow}
                  >
                    <Txt variant="strong" color="teal">
                      {SYSTEM_STRINGS.linkedManip(
                        MANIP_VERB[linkedManip.type],
                        linkedManip.dueAt === null ? '' : formatDue(linkedManip.dueAt, now),
                      )}
                    </Txt>
                    <Icon name="chevron-right" color="teal" />
                  </Pressable>
                ) : (
                  alert.severity === 'mineure' && (
                    <View style={styles.linkRow}>
                      <Button
                        label={SYSTEM_STRINGS.createManip}
                        variant="secondary"
                        onPress={() => createManipFromAlert(alert.id)}
                      />
                    </View>
                  )
                )}
              </Card>
            );
          })
        )}

        {resolvedAlerts.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={SYSTEM_STRINGS.resolvedAlerts(resolvedAlerts.length)}
            accessibilityState={{ expanded: resolvedOpen }}
            onPress={() => setResolvedOpen((open) => !open)}
            style={styles.resolvedToggle}
          >
            <Icon name="history" color="teal" />
            <Txt variant="strong" color="teal" style={styles.fill}>
              {SYSTEM_STRINGS.resolvedAlerts(resolvedAlerts.length)}
            </Txt>
            <Icon name={resolvedOpen ? 'expand-less' : 'expand-more'} color="teal" />
          </Pressable>
        )}
        {resolvedOpen &&
          resolvedAlerts.map((alert) => (
            <Card key={alert.id}>
              <Txt variant="label">{alert.title}</Txt>
              <Txt variant="meta" color="textMuted">
                {formatSinceDetailed(alert.since, now)}
              </Txt>
            </Card>
          ))}
      </View>

      {ongoingManips.length > 0 && (
        <View style={styles.stack}>
          <Txt variant="h2" accessibilityRole="header">
            {SYSTEM_STRINGS.ongoingManipsTitle}
          </Txt>
          {ongoingManips.map((manip) => {
            const visual = MANIP_VISUAL[manip.type];
            return (
              <Card key={manip.id}>
                <View style={styles.manipMain}>
                  <IconPastille icon={visual.icon} tone={visual.tone} />
                  <View style={styles.fill}>
                    <Txt variant="label">{MANIP_VERB[manip.type]}</Txt>
                    {manip.dueAt !== null && (
                      <View style={styles.dueRow}>
                        <Icon name="event" size={20} color="textMuted" />
                        <Txt variant="body">{formatDue(manip.dueAt, now)}</Txt>
                      </View>
                    )}
                  </View>
                </View>
                {manip.status === 'attente_confirmation' ? (
                  <Txt variant="small" color="textMuted" style={styles.waiting}>
                    {SYSTEM_STRINGS.waitingBatteryConfirmation}
                  </Txt>
                ) : (
                  <Button
                    label={SYSTEM_STRINGS.close}
                    block
                    onPress={() => router.push(`/manip/${manip.id}/close`)}
                  />
                )}
              </Card>
            );
          })}
        </View>
      )}

      <View style={styles.stack}>
        <Txt variant="h2" accessibilityRole="header">
          {SYSTEM_STRINGS.dataCardTitle}
        </Txt>
        <Card
          onPress={() => router.push(`/system/${system.id}/data`)}
          accessibilityLabel={SYSTEM_STRINGS.seeData}
        >
          <View style={styles.dataLine}>
            <Icon name={dataLines.icon} color={verdict.kind === 'anormal' ? 'warning' : 'teal'} />
            <Txt variant="strong" color={verdict.kind === 'anormal' ? 'warning' : 'forest'}>
              {dataLines.primary}
            </Txt>
          </View>
          {dataLines.secondary.length > 0 && (
            <Txt variant="meta" color="textMuted" style={styles.dataDetail}>
              {dataLines.secondary}
            </Txt>
          )}
          <View style={styles.linkRow}>
            <Txt variant="strong" color="teal">
              {SYSTEM_STRINGS.seeData}
            </Txt>
            <Icon name="chevron-right" color="teal" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function healthInk(status: HealthStatus) {
  return status === 'en_panne' ? 'danger' : status === 'a_surveiller' ? 'warning' : 'forest';
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerClient: { gap: theme.spacing.xxs, paddingBottom: theme.spacing.sm },
  idCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  statusBox: {
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  unverifiedBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.offline,
    backgroundColor: theme.colors.offlineBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.md },
  stack: { gap: theme.spacing.md },
  alertHead: { flexDirection: 'row', justifyContent: 'flex-end' },
  severityBadge: { borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  since: { marginTop: theme.spacing.xxs },
  block: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  blockYellow: { backgroundColor: theme.colors.yellow },
  blockMint: { backgroundColor: theme.colors.mint },
  blockTitle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  linkRow: {
    minHeight: theme.touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: theme.spacing.sm,
  },
  resolvedToggle: {
    minHeight: theme.touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow,
  },
  manipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  waiting: { textAlign: 'center' },
  dataLine: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dataDetail: { marginTop: theme.spacing.xxs },
});
