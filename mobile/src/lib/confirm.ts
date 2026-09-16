import { Alert, Platform } from 'react-native';

/**
 * Asks before a destructive or consequential action. React Native's Alert does
 * nothing on web, so the browser's own confirm dialog is used there.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  destructive = true,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Keep it', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** A simple message the person must acknowledge, e.g. why a delete was refused. */
export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
