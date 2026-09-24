import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { buildGreeting } from '../../core/greeting';
import { Button } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { useAppState } from '../AppProvider';
import { STRINGS } from './strings';

// Example feature screen: store via selectors, core logic via pure functions,
// visuals via ui/ components + theme tokens.
export function HomeScreen() {
  const userName = useAppState((s) => s.userName);
  const setUserName = useAppState((s) => s.setUserName);
  const [draft, setDraft] = useState('');
  const [greeted, setGreeted] = useState(false);

  const greeting = greeted ? buildGreeting(userName) : null;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {STRINGS.title}
      </Text>
      <TextInput
        accessibilityLabel={STRINGS.namePlaceholder}
        placeholder={STRINGS.namePlaceholder}
        placeholderTextColor={theme.colors.textMuted}
        value={draft}
        onChangeText={setDraft}
        style={styles.input}
      />
      <Button
        label={STRINGS.greetButton}
        onPress={() => {
          setUserName(draft);
          setGreeted(true);
        }}
      />
      {greeting !== null && <Text style={styles.greeting}>{greeting.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bg,
    flex: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  greeting: { color: theme.colors.text, fontSize: theme.font.title },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.body,
    padding: theme.spacing.md,
  },
  title: { color: theme.colors.text, fontSize: theme.font.title, fontWeight: '700' },
});
