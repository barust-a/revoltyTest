import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SyncState } from '../core/types';
import { UI_STRINGS } from './strings';
import { theme } from './theme';
import { Icon, Txt } from './Txt';

export function SyncBadge({ sync, onRetry }: { sync: SyncState; onRetry?: () => void }) {
  const label = UI_STRINGS.sync[sync];
  if (sync === 'echec') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onRetry}
        style={({ pressed }) => [styles.badge, styles.fail, pressed && styles.pressed]}
      >
        <Icon name="refresh" size={20} color="white" />
        <Txt variant="small" color="white">
          {label}
        </Txt>
      </Pressable>
    );
  }
  return (
    <View style={[styles.badge, sync === 'envoyee' ? styles.sent : styles.pending]}>
      <Icon name={sync === 'envoyee' ? 'cloud-done' : 'cloud-upload'} size={18} color="forest" />
      <Txt variant="small" color="forest" numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  pending: { backgroundColor: theme.colors.offlineBar },
  sent: { backgroundColor: theme.colors.mintStrong },
  fail: { backgroundColor: theme.colors.danger, minHeight: theme.touch.min, paddingHorizontal: 14 },
  pressed: { opacity: 0.75 },
});
