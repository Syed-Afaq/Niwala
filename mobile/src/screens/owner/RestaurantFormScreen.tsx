import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { FormScroll } from '../../components/FormScroll';
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
    <FormScroll>
      <Text style={[type.title, { marginBottom: spacing.xs }]}>
        {isEditing ? 'Edit restaurant' : 'New restaurant'}
      </Text>
      <Text style={[type.muted, { marginBottom: spacing.xl }]}>
        {isEditing
          ? 'Changes show up for customers straight away.'
          : 'Tell customers what you serve. A good cover photo makes a real difference.'}
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
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
});
