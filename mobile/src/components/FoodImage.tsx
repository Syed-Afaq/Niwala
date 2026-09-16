import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { imageSource } from '../config';
import { toneFor } from '../theme/theme';

/**
 * A food photo that never shows a broken image.
 *
 * A placeholder - a muted tone chosen from the cuisine plus an initial - is
 * always drawn underneath, and the photo sits on top at full opacity. An image
 * that is still loading, or failed, paints nothing, so the placeholder shows
 * through until the photo arrives.
 *
 * The photo is deliberately not hidden until a load event: on react-native-web
 * Image fires onLoadStart but never onLoad, so any fade gated on onLoad left
 * loaded photos permanently invisible.
 */
export function FoodImage({
  path,
  name,
  toneKey,
  style,
  initialSize = 44,
}: {
  path: string | null | undefined;
  /** Used for the initial and the accessibility label. */
  name: string;
  /** What picks the placeholder colour, typically the cuisine. */
  toneKey: string;
  style?: StyleProp<ViewStyle>;
  initialSize?: number;
}) {
  const uri = imageSource(path);
  const tone = toneFor(toneKey || name);
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View
      style={[styles.frame, { backgroundColor: tone.background }, style]}
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      {initial ? (
        <Text style={[styles.initial, { color: tone.foreground, fontSize: initialSize }]}>
          {initial}
        </Text>
      ) : null}

      {uri ? (
        // key={uri}: a different photo mounts a fresh image rather than
        // briefly showing the previous one.
        <Image key={uri} source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700', opacity: 0.55 },
});
