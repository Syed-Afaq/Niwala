import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { describeError } from '../../api/client';
import { Button, ErrorBanner, TextField } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
import type { Role } from '../../api/types';

export function RegisterScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('REGULAR_USER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email.trim(), password, role);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.wordmark}>Niwala</Text>
        <Text style={[type.heading, { marginTop: spacing.xl, marginBottom: spacing.lg }]}>
          Create your account
        </Text>

        <ErrorBanner message={error} />

        <TextField
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          testID="register-email"
        />
        <TextField
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          testID="register-password"
        />

        <Text style={[type.label, { marginBottom: spacing.sm }]}>I AM SIGNING UP TO</Text>
        <View style={styles.roleRow}>
          <RoleOption
            title="Order food"
            caption="Browse restaurants and place orders"
            selected={role === 'REGULAR_USER'}
            onPress={() => setRole('REGULAR_USER')}
            testID="role-customer"
          />
          <RoleOption
            title="Run a restaurant"
            caption="Manage menus and fulfil orders"
            selected={role === 'RESTAURANT_OWNER'}
            onPress={() => setRole('RESTAURANT_OWNER')}
            testID="role-owner"
          />
        </View>

        <Button
          label="Create account"
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: spacing.xl }}
        />

        <Pressable onPress={onGoToLogin} style={styles.switch} testID="go-login">
          <Text style={type.muted}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleOption({
  title,
  caption,
  selected,
  onPress,
  testID,
}: {
  title: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.roleOption, selected ? styles.roleOptionSelected : null]}
    >
      <Text style={[type.subheading, selected ? { color: colors.primaryDark } : null]}>
        {title}
      </Text>
      <Text style={[type.muted, { marginTop: 2 }]}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  roleRow: { gap: spacing.md },
  roleOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  roleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  switch: { marginTop: spacing.xl, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
