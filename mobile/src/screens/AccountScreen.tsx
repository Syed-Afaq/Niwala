import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card } from '../components/ui';
import { colors, radius, spacing, type } from '../theme/theme';

const ROLE_LABEL: Record<string, string> = {
  REGULAR_USER: 'Customer',
  RESTAURANT_OWNER: 'Restaurant owner',
};

export function AccountScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[type.title, { marginBottom: spacing.lg }]}>Account</Text>

      <Card>
        <Text style={type.label}>SIGNED IN AS</Text>
        <Text style={[type.subheading, { marginTop: spacing.xs }]} testID="account-email">
          {user?.email ?? '-'}
        </Text>

        <Text style={[type.label, { marginTop: spacing.lg }]}>ROLE</Text>
        <Text style={[type.body, { marginTop: spacing.xs }]} testID="account-role">
          {user ? ROLE_LABEL[user.role] ?? user.role : '-'}
        </Text>
      </Card>

      {user?.isBlocked ? (
        <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Your account is blocked</Text>
          <Text style={styles.blockedText}>
            You can still browse and follow existing orders, but new orders cannot be
            placed. Contact the restaurant if you think this is a mistake.
          </Text>
        </View>
      ) : null}

      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => void signOut()}
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  blocked: {
    marginTop: spacing.lg,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    padding: spacing.lg,
  },
  blockedTitle: { ...type.subheading, color: colors.error },
  blockedText: { ...type.muted, color: colors.error, marginTop: spacing.xs },
});
