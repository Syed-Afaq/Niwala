import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { imageSource } from '../config';
import { toneFor } from '../theme/theme';

/**
 * A food photo that never shows a broken image.
 *
 * The placeholder - a muted tone chosen from the cuisine plus an initial - is
 * always rendered underneath. When a photo exists it fades in on top once it
 * has loaded, and if it fails to load the placeholder simply stays.
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
  style?: ViewStyle;
  initialSize?: number;
}) {
  const uri = imageSource(path);
  const [failed, setFailed] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const tone = toneFor(toneKey || name);

  // A new photo should fade in again, and get a fresh chance to load.
  useEffect(() => {
    setFailed(false);
    opacity.setValue(0);
  }, [uri, opacity]);

  return (
    <View
      style={[styles.frame, { backgroundColor: tone.background }, style]}
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <Text style={[styles.initial, { color: tone.foreground, fontSize: initialSize }]}>
        {name.trim().charAt(0).toUpperCase()}
      </Text>

      {uri && !failed ? (
        <Animated.Image
          source={{ uri }}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity }]}
          onLoad={() =>
            Animated.timing(opacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }).start()
          }
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700', opacity: 0.55 },
});
