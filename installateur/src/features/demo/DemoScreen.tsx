import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppState } from '../AppProvider';
import { Button, OptionRow } from '../../ui/Button';
import { Screen, SubHeader } from '../../ui/Screen';
import { theme } from '../../ui/theme';
import { Txt } from '../../ui/Txt';
import { DEMO_STRINGS } from './strings';

// Demo-only controls (not part of the spec's user flows): each button stages a scenario
// for the presenter, then hands back to the app where the effect is visible.
export function DemoScreen() {
  const offline = useAppState((s) => s.offline);
  const setOffline = useAppState((s) => s.setOffline);
  const armSendFailure = useAppState((s) => s.armSendFailure);
  const triggerOutage = useAppState((s) => s.triggerOutage);
  const bringAlertBack = useAppState((s) => s.bringAlertBack);
  const resetDemo = useAppState((s) => s.resetDemo);

  return (
    <Screen header={<SubHeader title={DEMO_STRINGS.title} onBack={() => router.back()} />}>
      <Txt variant="body">{DEMO_STRINGS.intro}</Txt>

      <OptionRow
        title={DEMO_STRINGS.toggleOffline}
        description={offline ? DEMO_STRINGS.toggleOfflineOn : DEMO_STRINGS.toggleOfflineOff}
        selected={offline}
        onPress={() => setOffline(!offline)}
      />

      <DemoAction
        label={DEMO_STRINGS.failNextSend}
        detail={DEMO_STRINGS.failNextSendDetail}
        onPress={armSendFailure}
      />

      <DemoAction
        label={DEMO_STRINGS.outage}
        detail={DEMO_STRINGS.outageDetail}
        onPress={() => {
          triggerOutage();
          router.back();
        }}
      />

      <DemoAction
        label={DEMO_STRINGS.bringBack}
        detail={DEMO_STRINGS.bringBackDetail}
        onPress={() => bringAlertBack('sys-petit')}
      />

      <DemoAction
        label={DEMO_STRINGS.reset}
        detail={DEMO_STRINGS.resetDetail}
        onPress={() => {
          resetDemo();
          router.replace('/');
        }}
      />
    </Screen>
  );
}

function DemoAction({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.action}>
      <Button label={label} variant="secondary" block onPress={onPress} />
      <Txt variant="small" color="textMuted">
        {detail}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { gap: theme.spacing.xs },
});
