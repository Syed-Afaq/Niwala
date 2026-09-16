import { request } from './client';
import type {
  AuthResponse,
  Meal,
  Order,
  OrderStatus,
  Restaurant,
  Role,
  User,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      allowUnauthorized: true,
    }),
  register: (email: string, password: string, role: Role) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password, role },
      allowUnauthorized: true,
    }),
  me: () => request<{ user: User }>('/auth/me'),
};

export const restaurantApi = {
  list: () => request<{ restaurants: Restaurant[] }>('/restaurants'),
  mine: () => request<{ restaurants: Restaurant[] }>('/restaurants/mine'),
  get: (id: string) => request<{ restaurant: Restaurant }>(`/restaurants/${id}`),
  create: (body: { name: string; description: string; foodType: string }) =>
    request<{ restaurant: Restaurant }>('/restaurants', { method: 'POST', body }),
  update: (
    id: string,
    body: Partial<{ name: string; description: string; foodType: string }>
  ) => request<{ restaurant: Restaurant }>(`/restaurants/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => request<void>(`/restaurants/${id}`, { method: 'DELETE' }),
};

export const mealApi = {
  listFor: (restaurantId: string) =>
    request<{ meals: Meal[] }>(`/restaurants/${restaurantId}/meals`),
  create: (
    restaurantId: string,
    body: { name: string; description: string; price: number }
  ) => request<{ meal: Meal }>(`/restaurants/${restaurantId}/meals`, { method: 'POST', body }),
  update: (
    id: string,
    body: Partial<{ name: string; description: string; price: number }>
  ) => request<{ meal: Meal }>(`/meals/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => request<void>(`/meals/${id}`, { method: 'DELETE' }),
};

export const orderApi = {
  list: () => request<{ orders: Order[] }>('/orders'),
  get: (id: string) => request<{ order: Order }>(`/orders/${id}`),
  create: (items: { mealId: string; quantity: number }[]) =>
    request<{ order: Order }>('/orders', { method: 'POST', body: { items } }),
  setStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const userApi = {
  customers: () => request<{ customers: User[] }>('/users/customers'),
  setBlocked: (id: string, isBlocked: boolean) =>
    request<{ user: User }>(`/users/${id}/blocked`, { method: 'PATCH', body: { isBlocked } }),
};
