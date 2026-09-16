import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TabIconName = 'restaurants' | 'orders' | 'account';

/**
 * Tab icons drawn from plain views.
 *
 * An icon font would pull in a dependency for three glyphs, so these are built
 * from primitives instead: a bowl, a receipt, and a person, sharing one
 * geometric language so they read as a set.
 */
export function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  if (name === 'restaurants') {
    return (
      <View style={styles.box}>
        <View style={[styles.steam, { backgroundColor: color }]} />
        <View style={[styles.bowl, { borderColor: color }]} />
        <View style={[styles.base, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'orders') {
    return (
      <View style={styles.box}>
        <View style={[styles.receipt, { borderColor: color }]}>
          <View style={[styles.receiptLine, { backgroundColor: color }]} />
          <View style={[styles.receiptLine, styles.receiptLineShort, { backgroundColor: color }]} />
          <View style={[styles.receiptLine, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

const SIZE = 24;

const styles = StyleSheet.create({
  box: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },

  steam: { width: 2, height: 4, borderRadius: 1, marginBottom: 2, opacity: 0.7 },
  bowl: {
    width: 20,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  base: { width: 12, height: 2, borderRadius: 1, marginTop: 2 },

  receipt: {
    width: 16,
    height: 20,
    borderWidth: 2,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingTop: 4,
    gap: 2.5,
  },
  receiptLine: { height: 1.5, borderRadius: 1 },
  receiptLineShort: { width: '60%' },

  head: { width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  shoulders: {
    width: 18,
    height: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    marginTop: 2,
  },
});
