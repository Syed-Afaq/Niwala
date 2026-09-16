import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { Button, ErrorBanner, TextField } from '../../components/ui';
import { spacing, type } from '../../theme/theme';
import type { Meal } from '../../api/types';

export function MealFormScreen({
  restaurantId,
  meal,
  onDone,
}: {
  restaurantId: string;
  /** Omitted when adding a new meal. */
  meal?: Meal;
  onDone: () => void;
}) {
  const isEditing = Boolean(meal);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: meal?.name ?? '',
    description: meal?.description ?? '',
    price: meal?.price ?? '',
  });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
      };
      return isEditing
        ? mealApi.update((meal as Meal).id, body)
        : mealApi.create(restaurantId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      void queryClient.invalidateQueries({ queryKey: ['meals', restaurantId] });
      onDone();
    },
    onError: (err) => setError(describeError(err)),
  });

  function handleSave() {
    setError(null);

    if (!form.name.trim() || !form.description.trim()) {
      setError('Name and description are required.');
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a price greater than 0.');
      return;
    }
    if (Number(price.toFixed(2)) !== price) {
      setError('Price can have at most 2 decimal places.');
      return;
    }

    save.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[type.title, { marginBottom: spacing.lg }]}>
        {isEditing ? 'Edit meal' : 'New meal'}
      </Text>

      <ErrorBanner message={error} />

      <TextField
        label="NAME"
        value={form.name}
        onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        placeholder="Margherita Pizza"
        testID="meal-name"
      />
      <TextField
        label="PRICE"
        value={String(form.price)}
        onChangeText={(price) => setForm((f) => ({ ...f, price }))}
        placeholder="11.50"
        keyboardType="decimal-pad"
        testID="meal-price"
      />
      <TextField
        label="DESCRIPTION"
        value={form.description}
        onChangeText={(description) => setForm((f) => ({ ...f, description }))}
        placeholder="What is in it"
        multiline
        numberOfLines={3}
        style={styles.textarea}
        testID="meal-description"
      />

      <Button
        label={isEditing ? 'Save changes' : 'Add meal'}
        onPress={handleSave}
        loading={save.isPending}
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
  textarea: { minHeight: 80, paddingTop: spacing.md, textAlignVertical: 'top' },
});
