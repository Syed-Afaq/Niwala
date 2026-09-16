export type Role = 'REGULAR_USER' | 'RESTAURANT_OWNER';

export type OrderStatus =
  | 'PLACED'
  | 'CANCELED'
  | 'PROCESSING'
  | 'IN_ROUTE'
  | 'DELIVERED'
  | 'RECEIVED';

export type User = {
  id: string;
  email: string;
  role: Role;
  isBlocked: boolean;
  createdAt?: string;
};

export type Restaurant = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  foodType: string;
  /** Path such as /uploads/abc.jpg, or null when no photo was added. */
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  meals?: Meal[];
};

export type Meal = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  /** Exact decimal as a string, e.g. "11.5". */
  price: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  mealId: string;
  quantity: number;
  unitPrice: string;
  meal: Pick<Meal, 'id' | 'name' | 'description'>;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedById: string;
  changedAt: string;
};

export type Order = {
  id: string;
  userId: string;
  restaurantId: string;
  totalAmount: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  restaurant: Pick<Restaurant, 'id' | 'name' | 'foodType'> & { ownerId?: string };
  user: Pick<User, 'id' | 'email' | 'isBlocked'>;
  items: OrderItem[];
  history: OrderStatusHistory[];
};

export type AuthResponse = { user: User; token: string };
