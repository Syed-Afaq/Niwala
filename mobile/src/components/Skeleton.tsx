import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, DimensionValue, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/theme';

/**
 * Loading placeholders shaped like the content they stand in for, so the page
 * does not jump when data arrives. All blocks in a group share one gentle
 * pulse rather than each running its own animation.
 */
const PulseContext = createContext<Animated.Value | null>(null);

function SkeletonGroup({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const driver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: driver }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: driver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <PulseContext.Provider value={pulse}>
      <View
        style={style}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        testID="skeleton"
      >
        {children}
      </View>
    </PulseContext.Provider>
  );
}

export function Bone({
  width = '100%',
  height,
  style,
}: {
  width?: DimensionValue;
  height: number;
  style?: ViewStyle;
}) {
  const pulse = useContext(PulseContext);
  return (
    <Animated.View
      style={[styles.bone, { width, height, opacity: pulse ?? 1 }, style]}
    />
  );
}

function CardSkeleton({ mediaRatio }: { mediaRatio: number }) {
  return (
    <View style={styles.card}>
      <Bone height={0} style={{ height: undefined, aspectRatio: mediaRatio, borderRadius: 0 }} />
      <View style={styles.cardBody}>
        <Bone width="60%" height={18} />
        <Bone width="30%" height={12} style={{ marginTop: spacing.sm }} />
        <Bone width="90%" height={12} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

/** Title, search field and image cards. */
export function RestaurantListSkeleton({ withSearch = true }: { withSearch?: boolean }) {
  return (
    <SkeletonGroup style={styles.page}>
      <Bone width={120} height={12} />
      <Bone width="55%" height={30} style={{ marginTop: spacing.sm }} />
      <Bone width={140} height={12} style={{ marginTop: spacing.sm }} />
      {withSearch ? <Bone height={46} style={{ marginTop: spacing.lg, borderRadius: radius.md }} /> : null}
      <View style={{ marginTop: spacing.xl }}>
        <CardSkeleton mediaRatio={16 / 9} />
        <CardSkeleton mediaRatio={16 / 9} />
      </View>
    </SkeletonGroup>
  );
}

/** Cover photo, restaurant details and dish cards. */
export function MenuSkeleton() {
  return (
    <SkeletonGroup>
      <Bone height={0} style={{ height: undefined, aspectRatio: 16 / 9, borderRadius: 0 }} />
      <View style={styles.page}>
        <Bone width={80} height={12} />
        <Bone width="65%" height={28} style={{ marginTop: spacing.sm }} />
        <Bone width="95%" height={14} style={{ marginTop: spacing.md }} />
        <Bone width="70%" height={14} style={{ marginTop: spacing.sm }} />
        <View style={{ marginTop: spacing.xxl }}>
          <CardSkeleton mediaRatio={16 / 10} />
        </View>
      </View>
    </SkeletonGroup>
  );
}

/** A header and a few order rows. */
export function OrderListSkeleton() {
  return (
    <SkeletonGroup style={styles.page}>
      <Bone width="45%" height={30} />
      <Bone width={160} height={12} style={{ marginTop: spacing.sm }} />
      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.card, styles.row]}>
            <Bone width={56} height={56} style={{ borderRadius: radius.md }} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Bone width="55%" height={16} />
              <Bone width="80%" height={12} />
              <Bone width="35%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

/** Order header, progress steps and receipt. */
export function OrderDetailSkeleton() {
  return (
    <SkeletonGroup style={styles.page}>
      <View style={styles.row}>
        <Bone width={56} height={56} style={{ borderRadius: radius.md }} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Bone width="60%" height={20} />
          <Bone width="40%" height={12} />
        </View>
      </View>
      <View style={[styles.card, styles.cardBody, { marginTop: spacing.xl, gap: spacing.lg }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.row}>
            <Bone width={22} height={22} style={{ borderRadius: 11 }} />
            <Bone width="45%" height={14} />
          </View>
        ))}
      </View>
      <View style={[styles.card, styles.cardBody, { marginTop: spacing.lg, gap: spacing.md }]}>
        <Bone width="70%" height={14} />
        <Bone width="55%" height={14} />
        <Bone width="35%" height={18} style={{ marginTop: spacing.sm }} />
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingTop: spacing.xl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  bone: { backgroundColor: colors.border, borderRadius: radius.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  cardBody: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
});
