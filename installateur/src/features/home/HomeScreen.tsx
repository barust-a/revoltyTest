import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { buildPark } from '../../core/park';
import { buildTodo } from '../../core/todo';
import type { HealthStatus } from '../../core/types';
import { useAppState, useNow, useServices } from '../AppProvider';
import { Button } from '../../ui/Button';
import { HealthIcon, healthBoxStyle, HEALTH_VISUAL } from '../../ui/HealthBadge';
import { Screen } from '../../ui/Screen';
import { Banner, Card, IconPastille, Mascot, SectionTitle } from '../../ui/Surfaces';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { ParkListRow } from './ParkRow';
import { TodoCard } from './TodoCard';
import {
  buildConnectionView,
  buildHealthTiles,
  buildParkList,
  filterBadgeLabel,
  formatFullDate,
} from './homeView';
import { HOME_STRINGS } from './strings';

// A tile occupies roughly half the row of the 2×2 health grid (spec §3.4 A.2).
const TILE_BASIS = '48%';

export function HomeScreen() {
  const services = useServices();
  const now = useNow();
  const domain = useAppState((s) => s.domain);
  const offline = useAppState((s) => s.offline);
  const dataAsOf = useAppState((s) => s.dataAsOf);
  const recoveredFromCorruption = useAppState((s) => s.recoveredFromCorruption);
  const refresh = useAppState((s) => s.refresh);
  const retrySync = useAppState((s) => s.retrySync);
  const confirmSelfResolved = useAppState((s) => s.confirmSelfResolved);
  const dismissRecovery = useAppState((s) => s.dismissRecovery);

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<HealthStatus | null>(null);
  const [todoExpanded, setTodoExpanded] = useState(false);
  const [outageExpanded, setOutageExpanded] = useState(false);
  const [okExpanded, setOkExpanded] = useState(false);

  const park = buildPark(domain.systems, domain.alerts, now);
  const connection = buildConnectionView(offline, dataAsOf, domain.queue);
  const healthTiles = buildHealthTiles(park.counts);

  const todoLimited = buildTodo(domain, now);
  const todo = todoExpanded ? buildTodo(domain, now, Infinity) : todoLimited;
  const isTodoEmpty = todoLimited.total === 0;

  const parkList = buildParkList(park, query, filterStatus, outageExpanded, okExpanded);

  function toggleFilter(status: HealthStatus) {
    setFilterStatus((prev) => (prev === status ? null : status));
  }

  return (
    <Screen
      header={
        <View>
          <View style={styles.headerRow}>
            <View style={styles.greeting}>
              <Txt variant="h1" color="white">
                {HOME_STRINGS.greeting(services.demo.installerName)}
              </Txt>
              <Txt variant="body" color="onTealMuted">
                {formatFullDate(now)}
              </Txt>
            </View>
            <Button
              label={HOME_STRINGS.installer}
              icon="add"
              variant="yellow"
              onPress={() => router.push('/install')}
            />
          </View>
          <ConnectionStatus connection={connection} />
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refresh} tintColor={theme.colors.white} />
      }
    >
      {recoveredFromCorruption && (
        <View style={styles.recovery}>
          <Banner tone="danger" title={HOME_STRINGS.recoveryTitle} />
          <Button label={HOME_STRINGS.recoveryOk} variant="secondary" onPress={dismissRecovery} />
        </View>
      )}

      {park.allOk ? (
        <View style={styles.calm}>
          <Mascot kind="cool" />
          <View style={styles.fill}>
            <Txt variant="label">{HOME_STRINGS.calmTitle(park.total)}</Txt>
            <Txt variant="meta">{HOME_STRINGS.calmDetail}</Txt>
          </View>
        </View>
      ) : (
        <View style={styles.tiles} accessibilityLabel="État du parc">
          {healthTiles.map((tile) => (
            <Pressable
              key={tile.status}
              accessibilityRole="button"
              accessibilityLabel={`${tile.label} · ${tile.count}`}
              accessibilityState={{ selected: filterStatus === tile.status }}
              onPress={() => toggleFilter(tile.status)}
              style={({ pressed }) => [
                styles.tile,
                healthBoxStyle(tile.status),
                filterStatus === tile.status && styles.tileSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.tileTop}>
                <Txt variant="h1" numeric color={HEALTH_VISUAL[tile.status].ink}>
                  {tile.count}
                </Txt>
                <HealthIcon status={tile.status} size={28} />
              </View>
              <Txt variant="strong">{tile.label}</Txt>
            </Pressable>
          ))}
        </View>
      )}

      {filterStatus !== null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filterBadgeLabel(filterStatus)}
          onPress={() => setFilterStatus(null)}
          style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
        >
          <Txt variant="small" color="teal">
            {filterBadgeLabel(filterStatus)}
          </Txt>
        </Pressable>
      )}

      <View style={styles.section}>
        <SectionTitle title={HOME_STRINGS.todoTitle} count={todoLimited.total} />
        {isTodoEmpty ? (
          <Card accessibilityLabel={HOME_STRINGS.emptyTodoTitle}>
            <View style={styles.empty}>
              <IconPastille icon="event-available" tone="yellow" />
              <Txt variant="label" style={styles.center}>
                {HOME_STRINGS.emptyTodoTitle}
              </Txt>
              <Txt variant="meta" style={styles.center}>
                {HOME_STRINGS.emptyTodoDetail}
              </Txt>
            </View>
          </Card>
        ) : (
          <View style={styles.stack}>
            {todo.cards.map((card) => (
              <TodoCard
                key={card.manipId}
                card={card}
                domain={domain}
                onRetry={retrySync}
                onConfirm={confirmSelfResolved}
              />
            ))}
            {!todoExpanded && todoLimited.hiddenCount > 0 && (
              <Button
                label={HOME_STRINGS.seeMore(todoLimited.hiddenCount)}
                variant="secondary"
                onPress={() => setTodoExpanded(true)}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.section} testID="park-section">
        <SectionTitle title={HOME_STRINGS.parkTitle} count={park.total} />
        <View style={styles.search}>
          <Icon name="search" color="teal" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={HOME_STRINGS.searchPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel={HOME_STRINGS.searchPlaceholder}
            style={styles.searchInput}
          />
          {query !== '' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={HOME_STRINGS.clearSearch}
              onPress={() => setQuery('')}
              style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
            >
              <Icon name="close" color="textMuted" />
            </Pressable>
          )}
        </View>
        {parkList.length === 0 ? (
          <Txt variant="meta">{HOME_STRINGS.noResults(query)}</Txt>
        ) : (
          <View style={styles.parkCard}>
            {parkList.map((item, index) => (
              <ParkListRow
                key={item.kind === 'row' ? item.row.systemId : item.kind}
                item={item}
                first={index === 0}
                onToggleOutage={() => setOutageExpanded((v) => !v)}
                onToggleOk={() => setOkExpanded((v) => !v)}
              />
            ))}
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={HOME_STRINGS.demoMenu}
        onPress={() => router.push('/demo')}
        style={({ pressed }) => [styles.demoLink, pressed && styles.pressed]}
      >
        <Txt variant="small" color="textMuted">
          {HOME_STRINGS.demoMenu}
        </Txt>
      </Pressable>
    </Screen>
  );
}

function ConnectionStatus({ connection }: { connection: ReturnType<typeof buildConnectionView> }) {
  if (connection.offline) {
    return (
      <View style={styles.netOff}>
        <Icon name="wifi-off" color="offlineInk" />
        <View style={styles.fill}>
          <Txt variant="small" color="offlineInk">
            {connection.label}
          </Txt>
          {connection.pendingLabel !== null && (
            <Txt variant="small" color="offlineInk">
              {connection.pendingLabel}
            </Txt>
          )}
          {connection.failedLabel !== null && (
            <Txt variant="small" color="danger">
              {connection.failedLabel}
            </Txt>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.netOk}>
      <View style={styles.dot} />
      <Txt variant="small" color="white">
        {connection.label}
      </Txt>
      {connection.pendingLabel !== null && (
        <Txt variant="small" color="onTealMuted">
          {connection.pendingLabel}
        </Txt>
      )}
      {connection.failedLabel !== null && (
        <Txt variant="small" color="yellow">
          {connection.failedLabel}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  greeting: { gap: theme.spacing.xxs },
  netOk: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  netOff: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  fill: { flex: 1, gap: theme.spacing.xxs },
  recovery: { gap: theme.spacing.sm },
  calm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  tile: {
    flexBasis: TILE_BASIS,
    flexGrow: 1,
    minHeight: theme.touch.choice,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileSelected: { borderWidth: 3 },
  pressed: { opacity: 0.75 },
  filterPill: {
    alignSelf: 'flex-start',
    minHeight: theme.touch.min,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.mintStrong,
  },
  section: { gap: theme.spacing.md },
  empty: { alignItems: 'center', gap: theme.spacing.sm },
  center: { textAlign: 'center' },
  stack: { gap: theme.spacing.md },
  parkCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    ...theme.shadow,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.touch.min,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.size.body,
    color: theme.colors.text,
  },
  clear: {
    minWidth: theme.touch.min,
    minHeight: theme.touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLink: {
    alignSelf: 'center',
    minHeight: theme.touch.min,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
});
