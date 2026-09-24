import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { TodoCard as TodoCardData } from '../../core/todo';
import type { DomainState } from '../../core/types';
import { Button } from '../../ui/Button';
import { Card, IconPastille } from '../../ui/Surfaces';
import { SyncBadge } from '../../ui/SyncBadge';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { capitalizeFirst, MANIP_VISUAL, ORIGIN_LABEL } from '../shared';
import { dueVisual, isAwaitingConfirmation, syncItemFor, urgencyIcon } from './homeView';
import { HOME_STRINGS } from './strings';

// One "À faire" card (spec §3.4 A.3 / maquette 1b): urgent header, verb + client, mentions,
// footer with either the due date or a SyncBadge, and a Clôturer / Confirmer action.
export function TodoCard({
  card,
  domain,
  onRetry,
  onConfirm,
}: {
  card: TodoCardData;
  domain: DomainState;
  onRetry: (queueId: string) => void;
  onConfirm: (manipId: string) => void;
}) {
  const visual = MANIP_VISUAL[card.type];
  const queueItem = card.sync !== null ? syncItemFor(domain, card.manipId) : null;
  const awaitingConfirmation = isAwaitingConfirmation(domain, card.manipId);
  const due = dueVisual(card.urgency);

  return (
    // The body and the footer are siblings: a touchable card must not contain other buttons
    // (invalid nested <button> on web, ambiguous targets with gloves).
    <Card style={[styles.card, card.urgency !== null && styles.urgent]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.verb} · ${card.clientName} · ${card.city}`}
        onPress={() => router.push(`/system/${card.systemId}`)}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        {card.urgency !== null && card.urgencyLabel !== null && (
          <View style={styles.head}>
            <View style={styles.badge}>
              <Icon name={urgencyIcon(card.urgency)} size={18} color="danger" />
              <Txt variant="small" color="danger">
                {card.urgencyLabel}
              </Txt>
            </View>
            <Txt variant="xs" color="textMuted">
              {ORIGIN_LABEL[card.origin]}
            </Txt>
          </View>
        )}

        <View style={styles.main}>
          <IconPastille icon={visual.icon} tone={visual.tone} />
          <View style={styles.fill}>
            <Txt variant="label">{card.verb}</Txt>
            <Txt variant="meta">
              {card.clientName} · {card.city}
            </Txt>
          </View>
        </View>

        {card.mentions.length > 0 && (
          <View style={styles.mentions}>
            {card.mentions.map((mention) => (
              <Txt key={mention} variant="xs" color="textMuted">
                {mention}
              </Txt>
            ))}
          </View>
        )}
      </Pressable>

      <View style={styles.foot}>
        {queueItem !== null ? (
          <SyncBadge sync={queueItem.sync} onRetry={() => onRetry(queueItem.id)} />
        ) : card.due !== null ? (
          <View style={styles.due}>
            <Icon name={due.icon} size={20} color={due.late ? 'danger' : 'forest'} />
            <Txt variant="small" color={due.late ? 'danger' : 'text'}>
              {capitalizeFirst(card.due)}
            </Txt>
          </View>
        ) : (
          <View />
        )}
        {awaitingConfirmation ? (
          <Button
            label={HOME_STRINGS.confirm}
            variant="secondary"
            onPress={() => onConfirm(card.manipId)}
          />
        ) : (
          <Button
            label={HOME_STRINGS.close}
            variant="secondary"
            onPress={() => router.push(`/manip/${card.manipId}/close`)}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.md },
  body: { gap: theme.spacing.md },
  pressed: { opacity: 0.8 },
  urgent: { borderWidth: 2, borderColor: theme.colors.danger },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  main: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  fill: { flex: 1, gap: theme.spacing.xxs },
  mentions: { gap: theme.spacing.xxs },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  due: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
});
