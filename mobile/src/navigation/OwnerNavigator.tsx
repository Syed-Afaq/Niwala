import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OwnerRestaurantsScreen } from '../screens/owner/OwnerRestaurantsScreen';
import { OwnerRestaurantDetailScreen } from '../screens/owner/OwnerRestaurantDetailScreen';
import { RestaurantFormScreen } from '../screens/owner/RestaurantFormScreen';
import { MealFormScreen } from '../screens/owner/MealFormScreen';
import { OwnerOrdersScreen } from '../screens/owner/OwnerOrdersScreen';
import { OwnerOrderDetailScreen } from '../screens/owner/OwnerOrderDetailScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { TabIcon } from '../components/TabIcon';
import { useOrderUpdates } from '../orders/OrderUpdatesContext';
import { colors } from '../theme/theme';

const RestaurantsStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const headerStyles = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: colors.background },
};

function RestaurantsNavigator() {
  return (
    <RestaurantsStack.Navigator screenOptions={headerStyles}>
      <RestaurantsStack.Screen name="MyRestaurants" options={{ headerShown: false }}>
        {({ navigation }) => (
          <OwnerRestaurantsScreen
            onOpenRestaurant={(id, name) =>
              navigation.navigate('OwnerRestaurantDetail', { id, name })
            }
            onCreateRestaurant={() => navigation.navigate('RestaurantForm', {})}
          />
        )}
      </RestaurantsStack.Screen>

      <RestaurantsStack.Screen
        name="OwnerRestaurantDetail"
        options={({ route }: any) => ({ title: route.params?.name ?? 'Restaurant' })}
      >
        {({ navigation, route }: any) => (
          <OwnerRestaurantDetailScreen
            restaurantId={route.params.id}
            onEditRestaurant={() =>
              navigation.navigate('RestaurantForm', { id: route.params.id })
            }
            onAddMeal={() => navigation.navigate('MealForm', { restaurantId: route.params.id })}
            onEditMeal={(meal) =>
              navigation.navigate('MealForm', { restaurantId: route.params.id, meal })
            }
            onDeleted={() => navigation.navigate('MyRestaurants')}
          />
        )}
      </RestaurantsStack.Screen>

      <RestaurantsStack.Screen name="RestaurantForm" options={{ title: 'Restaurant' }}>
        {({ navigation, route }: any) => (
          <RestaurantFormScreen
            restaurantId={route.params?.id}
            onDone={() => navigation.goBack()}
          />
        )}
      </RestaurantsStack.Screen>

      <RestaurantsStack.Screen name="MealForm" options={{ title: 'Meal' }}>
        {({ navigation, route }: any) => (
          <MealFormScreen
            restaurantId={route.params.restaurantId}
            meal={route.params?.meal}
            onDone={() => navigation.goBack()}
          />
        )}
      </RestaurantsStack.Screen>
    </RestaurantsStack.Navigator>
  );
}

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={headerStyles}>
      <OrdersStack.Screen name="OwnerOrderList" options={{ headerShown: false }}>
        {({ navigation }) => (
          <OwnerOrdersScreen
            onOpenOrder={(orderId) =>
              navigation.navigate('OwnerOrderDetail', { id: orderId })
            }
          />
        )}
      </OrdersStack.Screen>

      <OrdersStack.Screen name="OwnerOrderDetail" options={{ title: 'Order' }}>
        {({ route }: any) => <OwnerOrderDetailScreen orderId={route.params.id} />}
      </OrdersStack.Screen>
    </OrdersStack.Navigator>
  );
}

export function OwnerNavigator() {
  const orderUpdates = useOrderUpdates();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="Restaurants"
        component={RestaurantsNavigator}
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color }) => <TabIcon name="restaurants" color={color} />,
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
