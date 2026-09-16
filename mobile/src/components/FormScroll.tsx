import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../theme/theme';

/**
 * Scrolling container for forms that keeps the focused field above the
 * keyboard. On iOS the scroll view adjusts its own insets; Android resizes the
 * window for the keyboard. A KeyboardAvoidingView on top of this would shift
 * the content twice on iOS, so there is deliberately none.
 */
export function FormScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
