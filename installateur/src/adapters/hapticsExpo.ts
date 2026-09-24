import * as Haptics from 'expo-haptics';

import type { HapticsPort } from '../ports/device';

// Reserved for important moments (closure or installation success/failure). No-op on web.
export function createExpoHaptics(): HapticsPort {
  const notify = (type: Haptics.NotificationFeedbackType) => {
    Haptics.notificationAsync(type).catch(() => undefined);
  };
  return {
    success: () => notify(Haptics.NotificationFeedbackType.Success),
    warning: () => notify(Haptics.NotificationFeedbackType.Warning),
  };
}
