import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RestaurantListScreen } from '../screens/customer/RestaurantListScreen';
import { RestaurantDetailScreen } from '../screens/customer/RestaurantDetailScreen';
import { CartScreen } from '../screens/customer/CartScreen';
import { OrdersScreen } from '../screens/customer/OrdersScreen';
import { OrderDetailScreen } from '../screens/customer/OrderDetailScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { useCart } from '../cart/CartContext';
import { TabIcon } from '../components/TabIcon';
import { useOrderUpdates } from '../orders/OrderUpdatesContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

const BrowseStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const headerStyles = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: colors.background },
};

function BrowseNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={headerStyles}>
      <BrowseStack.Screen name="Restaurants" options={{ headerShown: false }}>
        {({ navigation }) => (
          <RestaurantListScreen
            onOpenRestaurant={(restaurant) =>
              navigation.navigate('RestaurantDetail', {
                id: restaurant.id,
                name: restaurant.name,
              })
            }
          />
        )}
      </BrowseStack.Screen>

      <BrowseStack.Screen
        name="RestaurantDetail"
        // The name is already the large title under the cover photo, so the
        // header shows no title text. `title` still names the screen, which
        // the browser tab and the back button use.
        options={({ route }: any) => ({
          title: route.params?.name ?? 'Restaurant',
          headerTitle: '',
          headerShadowVisible: false,
        })}
      >
        {({ navigation, route }: any) => (
          <RestaurantDetailScreen
            restaurantId={route.params.id}
            onViewCart={() => navigation.navigate('Cart')}
          />
        )}
      </BrowseStack.Screen>

      <BrowseStack.Screen name="Cart" options={{ title: 'Your order' }}>
        {({ navigation }) => (
          <CartScreen
            onBrowse={() => navigation.navigate('Restaurants')}
            onOrderPlaced={(orderId) => navigation.replace('OrderDetail', { id: orderId })}
          />
        )}
      </BrowseStack.Screen>

      <BrowseStack.Screen name="OrderDetail" options={{ title: 'Order' }}>
        {({ route }: any) => <OrderDetailScreen orderId={route.params.id} />}
      </BrowseStack.Screen>
    </BrowseStack.Navigator>
  );
}

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={headerStyles}>
      <OrdersStack.Screen name="OrderList" options={{ headerShown: false, title: 'Your orders' }}>
        {({ navigation }) => (
          <OrdersScreen
            onOpenOrder={(orderId) => navigation.navigate('OrderDetail', { id: orderId })}
            onBrowse={() => navigation.getParent()?.navigate('Browse')}
          />
        )}
      </OrdersStack.Screen>

      <OrdersStack.Screen name="OrderDetail" options={{ title: 'Order' }}>
        {({ route }: any) => <OrderDetailScreen orderId={route.params.id} />}
      </OrdersStack.Screen>
    </OrdersStack.Navigator>
  );
}

export function CustomerNavigator() {
  const cart = useCart();
  const orderUpdates = useOrderUpdates();
  const insets = useSafeAreaInsets();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // Each tab item pads itself by 5px, so the 24px icon, the label gap
          // and a 14px label need 58px of content height; less clips the label.
          // The bottom padding is the safe-area inset where there is one
          // (iPhone home indicator), or a fixed 12px where there is not.
          height: 8 + 58 + Math.max(insets.bottom, 12),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '600', marginTop: 2 },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="Browse"
        component={BrowseNavigator}
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color }) => <TabIcon name="restaurants" color={color} />,
          // The cart lives inside this stack, so the count belongs here.
          tabBarBadge: cart.itemCount > 0 ? cart.itemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabIcon name="orders" color={color} />,
          // Orders that are new or changed since they were last opened.
          tabBarBadge: orderUpdates.unseenCount > 0 ? orderUpdates.unseenCount : undefined,
        }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <TabIcon name="account" color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}
