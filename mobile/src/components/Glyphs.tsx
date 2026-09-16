import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Small status marks drawn from views, matching the tab and search icons, so
 * the app needs no icon font.
 */
export function CheckGlyph({ color, size = 12 }: { color: string; size?: number }) {
  const stroke = Math.max(2, size / 6);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.stroke,
          {
            backgroundColor: color,
            height: stroke,
            width: size * 0.42,
            left: size * 0.04,
            top: size * 0.52,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.stroke,
          {
            backgroundColor: color,
            height: stroke,
            width: size * 0.78,
            left: size * 0.26,
            top: size * 0.42,
            transform: [{ rotate: '-50deg' }],
          },
        ]}
      />
    </View>
  );
}

export function CrossGlyph({ color, size = 12 }: { color: string; size?: number }) {
  const stroke = Math.max(2, size / 6);
  const bar = { backgroundColor: color, height: stroke, width: size * 1.1, top: size / 2 - stroke / 2, left: -size * 0.05 };
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.stroke, bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.stroke, bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stroke: { position: 'absolute', borderRadius: 2 },
});
