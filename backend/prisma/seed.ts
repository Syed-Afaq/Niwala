import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Demo password shared by every seeded account.
 * Seed data is for local development only — never seed a real deployment.
 */
const DEMO_PASSWORD = 'password123';

// Fixed ids keep the seed idempotent: re-running updates rows instead of
// creating duplicates.
const OWNER_1 = '11111111-1111-4111-8111-111111111111';
const OWNER_2 = '11111111-1111-4111-8111-111111111112';
const USER_1 = '22222222-2222-4222-8222-222222222221';
const USER_2 = '22222222-2222-4222-8222-222222222222';

const REST_1 = '33333333-3333-4333-8333-333333333331';
const REST_2 = '33333333-3333-4333-8333-333333333332';
const REST_3 = '33333333-3333-4333-8333-333333333333';

type SeedUser = { id: string; email: string; role: Role };
type SeedRestaurant = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  foodType: string;
};
type SeedMeal = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: string;
};

const users: SeedUser[] = [
  { id: OWNER_1, email: 'owner1@niwala.test', role: Role.RESTAURANT_OWNER },
  { id: OWNER_2, email: 'owner2@niwala.test', role: Role.RESTAURANT_OWNER },
  { id: USER_1, email: 'user1@niwala.test', role: Role.REGULAR_USER },
  { id: USER_2, email: 'user2@niwala.test', role: Role.REGULAR_USER },
];

const restaurants: SeedRestaurant[] = [
  {
    id: REST_1,
    ownerId: OWNER_1,
    name: 'Bella Napoli',
    description: 'Wood-fired pizza and handmade pasta from a family recipe book.',
    foodType: 'Italian',
  },
  {
    id: REST_2,
    ownerId: OWNER_1,
    name: 'Sakura Ramen',
    description: 'Slow-simmered broths, fresh noodles, and small plates.',
    foodType: 'Japanese',
  },
  {
    id: REST_3,
    ownerId: OWNER_2,
    name: 'Taco Libre',
    description: 'Street-style tacos and grilled plates with house salsas.',
    foodType: 'Mexican',
  },
];

const meals: SeedMeal[] = [
  { id: '44444444-4444-4444-8444-000000000001', restaurantId: REST_1, name: 'Margherita Pizza', description: 'San Marzano tomato, fior di latte, basil.', price: '11.50' },
  { id: '44444444-4444-4444-8444-000000000002', restaurantId: REST_1, name: 'Tagliatelle Bolognese', description: 'Fresh egg pasta with a six-hour beef ragu.', price: '14.00' },
  { id: '44444444-4444-4444-8444-000000000003', restaurantId: REST_1, name: 'Tiramisu', description: 'Espresso-soaked savoiardi and mascarpone cream.', price: '6.75' },

  { id: '44444444-4444-4444-8444-000000000004', restaurantId: REST_2, name: 'Tonkotsu Ramen', description: 'Twelve-hour pork broth, chashu, soft egg.', price: '13.25' },
  { id: '44444444-4444-4444-8444-000000000005', restaurantId: REST_2, name: 'Chicken Karaage', description: 'Crisp marinated thigh with yuzu mayo.', price: '8.00' },
  { id: '44444444-4444-4444-8444-000000000006', restaurantId: REST_2, name: 'Matcha Cheesecake', description: 'Baked cheesecake with stone-ground matcha.', price: '7.25' },

  { id: '44444444-4444-4444-8444-000000000007', restaurantId: REST_3, name: 'Carne Asada Tacos', description: 'Three tacos, grilled steak, onion, cilantro.', price: '10.50' },
  { id: '44444444-4444-4444-8444-000000000008', restaurantId: REST_3, name: 'Chicken Quesadilla', description: 'Flour tortilla, Oaxaca cheese, pulled chicken.', price: '9.25' },
  { id: '44444444-4444-4444-8444-000000000009', restaurantId: REST_3, name: 'Elote', description: 'Grilled corn, cotija, lime, chili.', price: '4.50' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, role: user.role, passwordHash, isBlocked: false },
      create: { ...user, passwordHash },
    });
  }

  for (const restaurant of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: restaurant,
      create: restaurant,
    });
  }

  for (const meal of meals) {
    await prisma.meal.upsert({
      where: { id: meal.id },
      update: meal,
      create: meal,
    });
  }

  console.log(
    `Seeded ${users.length} users, ${restaurants.length} restaurants, ${meals.length} meals.`
  );
  console.log(`Demo password for every seeded account: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
