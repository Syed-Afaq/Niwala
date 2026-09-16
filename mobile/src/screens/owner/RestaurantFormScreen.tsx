import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { Button, ErrorBanner, Loading, TextField } from '../../components/ui';
import { ImagePickerField } from '../../components/ImagePickerField';
import { spacing, type } from '../../theme/theme';

export function RestaurantFormScreen({
  restaurantId,
  onDone,
}: {
  /** Omitted when creating. */
  restaurantId?: string;
  onDone: () => void;
}) {
  const isEditing = Boolean(restaurantId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    foodType: string;
    imageUrl: string | null;
  }>({ name: '', description: '', foodType: '', imageUrl: null });
  const [loaded, setLoaded] = useState(!isEditing);
  const [photoUploading, setPhotoUploading] = useState(false);

  const existing = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantApi.get(restaurantId as string).then((r) => r.restaurant),
    enabled: isEditing,
  });

  // Fill the form once, then let the person edit it freely.
  if (isEditing && existing.data && !loaded) {
    setForm({
      name: existing.data.name,
      description: existing.data.description,
      foodType: existing.data.foodType,
      imageUrl: existing.data.imageUrl,
    });
    setLoaded(true);
  }

  const save = useMutation({
    mutationFn: () =>
      isEditing
        ? restaurantApi.update(restaurantId as string, form)
        : restaurantApi.create(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      onDone();
    },
    onError: (err) => setError(describeError(err)),
  });

  if (isEditing && existing.isPending) {
    return <Loading label="Loading restaurant" />;
  }

  function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.description.trim() || !form.foodType.trim()) {
      setError('Name, description and food type are all required.');
      return;
    }
    save.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[type.title, { marginBottom: spacing.lg }]}>
        {isEditing ? 'Edit restaurant' : 'New restaurant'}
      </Text>

      <ErrorBanner message={error} />

      <ImagePickerField
        label="COVER PHOTO"
        value={form.imageUrl}
        onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
        onUploadingChange={setPhotoUploading}
        aspect={[16, 9]}
        previewName={form.name}
        toneKey={form.foodType}
        testID="restaurant-photo"
      />

      <TextField
        label="NAME"
        value={form.name}
        onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        placeholder="Bella Napoli"
        testID="restaurant-name"
      />
      <TextField
        label="FOOD TYPE"
        value={form.foodType}
        onChangeText={(foodType) => setForm((f) => ({ ...f, foodType }))}
        placeholder="Italian"
        testID="restaurant-foodtype"
      />
      <TextField
        label="DESCRIPTION"
        value={form.description}
        onChangeText={(description) => setForm((f) => ({ ...f, description }))}
        placeholder="What people should know about the food"
        multiline
        numberOfLines={4}
        style={styles.textarea}
        testID="restaurant-description"
      />

      <Button
        label={photoUploading ? 'Uploading photo' : isEditing ? 'Save changes' : 'Create restaurant'}
        onPress={handleSave}
        loading={save.isPending}
        disabled={photoUploading}
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
    paddingBottom: spacing.xxl,
  },
  textarea: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
});
