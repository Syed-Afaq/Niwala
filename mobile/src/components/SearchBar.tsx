import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';

/** Magnifier drawn from views, matching the tab icons rather than adding an icon font. */
function SearchGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={styles.lens} />
      <View style={styles.handle} />
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  testID,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
}) {
  return (
    <View style={styles.bar}>
      <SearchGlyph />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel="Search restaurants"
        testID={testID}
      />
      {value.length > 0 ? (
        // The tappable area is a full 40px even though the visible circle is
        // small: hitSlop alone is not honoured on every platform (web ignores it).
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearTarget}
          testID={testID ? `${testID}-clear` : undefined}
        >
          <View style={styles.clearCircle}>
            <View style={[styles.cross, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.cross, { transform: [{ rotate: '-45deg' }] }]} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  glyph: { width: 18, height: 18 },
  lens: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  handle: {
    position: 'absolute',
    top: 12,
    left: 11,
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '45deg' }],
  },
  clearTarget: {
    width: 40,
    height: 40,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cross: {
    position: 'absolute',
    width: 10,
    height: 1.6,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
});
