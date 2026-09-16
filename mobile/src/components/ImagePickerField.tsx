import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { describeError, uploadImage } from '../api/client';
import { FoodImage } from './FoodImage';
import { colors, radius, spacing, type } from '../theme/theme';

/**
 * Photo field for restaurant and meal forms.
 *
 * The chosen photo previews immediately from the device while it uploads in
 * the background, so saving the form only has to send the stored path. If the
 * upload fails, the preview falls back to the previous photo and says why.
 */
export function ImagePickerField({
  label,
  value,
  onChange,
  onUploadingChange,
  aspect,
  previewName,
  toneKey,
  testID,
}: {
  label: string;
  /** Stored image path, or null for none. */
  value: string | null;
  onChange: (path: string | null) => void;
  /** Lets the form hold its save button while a photo is still uploading. */
  onUploadingChange?: (uploading: boolean) => void;
  aspect: [number, number];
  previewName: string;
  toneKey: string;
  testID?: string;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  async function pick() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      // Re-encoding below full quality also turns iPhone HEIC photos into JPEG,
      // which the server accepts, and keeps uploads well under the size limit.
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLocalUri(asset.uri);
    setBusy(true);
    try {
      const path = await uploadImage(asset);
      if (!mounted.current) return;
      onChange(path);
    } catch (err) {
      if (!mounted.current) return;
      setLocalUri(null);
      setError(describeError(err));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function remove() {
    setError(null);
    setLocalUri(null);
    onChange(null);
  }

  const shownPath = localUri ?? value;
  const hasPhoto = Boolean(shownPath);

  return (
    <View style={styles.field} testID={testID}>
      <Text style={[type.label, styles.label]}>{label}</Text>

      <Pressable
        onPress={pick}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        style={({ pressed }) => [styles.frame, pressed ? styles.framePressed : null]}
      >
        <FoodImage
          path={shownPath}
          name={previewName}
          toneKey={toneKey || previewName}
          style={[styles.preview, { aspectRatio: aspect[0] / aspect[1] }]}
        />

        {!hasPhoto ? (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyTitle}>Add a photo</Text>
            <Text style={type.muted}>Tap to choose from your library</Text>
          </View>
        ) : null}

        {uploading ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[type.meta, { marginTop: spacing.sm }]}>Uploading photo</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={pick} disabled={uploading} hitSlop={8} style={styles.action}>
          <Text style={[styles.actionText, uploading ? styles.disabled : null]}>
            {hasPhoto ? 'Change photo' : 'Choose photo'}
          </Text>
        </Pressable>
        {hasPhoto && !uploading ? (
          <Pressable onPress={remove} hitSlop={8} style={styles.action}>
            <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const fill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const styles = StyleSheet.create({
  field: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.sm },
  frame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  framePressed: { opacity: 0.92 },
  preview: { width: '100%' },
  emptyOverlay: {
    ...fill,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  emptyTitle: { ...type.subheading, marginBottom: 2 },
  uploadingOverlay: {
    ...fill,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  action: { minHeight: 32, justifyContent: 'center' },
  actionText: { color: colors.primaryDark, fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },
  error: { ...type.muted, color: colors.error, marginTop: spacing.sm },
});
