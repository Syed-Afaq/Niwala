import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card } from '../components/ui';
import { colors, spacing, type } from '../theme/theme';

/**
 * Temporary landing screen so the foundation can be exercised end to end.
 * Replaced by the real customer and owner experiences in the next phases.
 */
export function PlaceholderHomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.title}>Niwala</Text>
        <Text style={[type.muted, { marginBottom: spacing.xl }]}>
          Signed in and ready.
        </Text>

        <Card>
          <Row label="EMAIL" value={user?.email ?? '-'} testID="home-email" />
          <Row label="ROLE" value={user?.role ?? '-'} testID="home-role" />
          <Row
            label="BLOCKED"
            value={user?.isBlocked ? 'Yes' : 'No'}
            testID="home-blocked"
          />
        </Card>

        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => void signOut()}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  testID,
}: {
  label: string;
  value: string;
  testID?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={type.label}>{label}</Text>
      <Text style={type.body} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  row: { marginBottom: spacing.md },
});
