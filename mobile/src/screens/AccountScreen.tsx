import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useHeaderlessTopPadding } from '../hooks/useScreenInsets';
import { Button } from '../components/ui';
import { colors, radius, spacing, type } from '../theme/theme';

const ROLE_LABEL: Record<string, string> = {
  REGULAR_USER: 'Customer',
  RESTAURANT_OWNER: 'Restaurant owner',
};

export function AccountScreen() {
  const { user, signOut } = useAuth();
  const topPadding = useHeaderlessTopPadding();
  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topPadding }]}>
      <Text style={type.title}>Account</Text>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.email} numberOfLines={1} testID="account-email">
            {user?.email ?? '-'}
          </Text>
          <Text style={type.meta} testID="account-role">
            {user ? ROLE_LABEL[user.role] ?? user.role : '-'}
          </Text>
        </View>
      </View>

      {user?.isBlocked ? (
        <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Your account is blocked</Text>
          <Text style={styles.blockedText}>
            You can still browse and follow your existing orders, but new orders cannot be placed.
            Contact the restaurant if you think this is a mistake.
          </Text>
        </View>
      ) : null}

      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => void signOut()}
        style={{ marginTop: spacing.xl }}
        testID="sign-out"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
  profileText: { flex: 1, minWidth: 0 },
  email: { fontSize: 17, fontWeight: '600', color: colors.text },
  blocked: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  blockedTitle: { fontSize: 16, fontWeight: '700', color: colors.error },
  blockedText: { ...type.body, color: colors.error, marginTop: spacing.xs },
});
