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
import { colors, spacing, type } from '../../theme/theme';

export function LoginScreen({ onGoToRegister }: { onGoToRegister: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
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
        <View style={styles.header}>
          <Text style={styles.wordmark}>Niwala</Text>
          <Text style={[type.muted, { marginTop: spacing.xs }]}>
            Good food, delivered.
          </Text>
        </View>

        <Text style={[type.heading, { marginBottom: spacing.lg }]}>Welcome back</Text>

        <ErrorBanner message={error} />

        <TextField
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          testID="login-email"
        />
        <TextField
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Your password"
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
          testID="login-password"
        />

        <Button label="Sign in" onPress={handleSubmit} loading={submitting} />

        <Pressable onPress={onGoToRegister} style={styles.switch} testID="go-register">
          <Text style={type.muted}>
            New here? <Text style={styles.link}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: { marginBottom: spacing.xxl },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  switch: { marginTop: spacing.xl, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
