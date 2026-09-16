import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { AccountScreen } from '../screens/AccountScreen';
import { Loading } from '../components/ui';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen onGoToRegister={() => navigation.navigate('Register')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => <RegisterScreen onGoToLogin={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/** Owner experience arrives in the next phase. */
function OwnerPlaceholder() {
  return <AccountScreen />;
}

/**
 * The only place that decides what a caller can reach.
 *
 * Auth screens and app screens are never mounted at the same time, so there is
 * no protected route to forget to guard: signing out unmounts the app entirely.
 * Which experience a signed-in user gets is decided by their role.
 */
export function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <Loading label="Starting Niwala" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signedIn' && user ? (
        user.role === 'RESTAURANT_OWNER' ? (
          <OwnerPlaceholder />
        ) : (
          <CustomerNavigator />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
