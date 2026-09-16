# Niwala

A food delivery app built for the Innovage.io technical screening.

Two roles share one system. A **customer** browses restaurants, builds a cart,
places an order and follows it to the door. A **restaurant owner** manages
their restaurants and menus, works orders through to delivery, and can block a
customer who abuses the service.

```
React Native (Expo) -> REST API -> Express + TypeScript -> Prisma -> PostgreSQL
```

## Contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [API reference](#api-reference)
- [How the rules are enforced](#how-the-rules-are-enforced)
- [Assumptions](#assumptions)
- [Testing](#testing)
- [Known limitations](#known-limitations)

## Quick start

You need Docker, Node 18+, and npm.

**1. Start PostgreSQL**

```bash
docker compose up -d
```

Postgres is published on **host port 5433**, not the usual 5432. A local
PostgreSQL install already owned 5432 on the development machine and silently
shadowed the container, so the mapping was moved to keep the two apart. If 5432
is free on your machine you can change the port back in `docker-compose.yml`
and `backend/.env`.

**2. Start the API**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

The API listens on http://localhost:4000. Check it:

```bash
curl http://localhost:4000/health
```

`prisma migrate dev` applies the schema and runs the seed, giving you three
restaurants, nine meals and the four demo accounts below. To reseed later:

```bash
npm run prisma:seed
```

**3. Start the app**

```bash
cd mobile
npm install
npx expo start
```

Press `i` for the iOS simulator, `a` for Android, or `w` to open it in a
browser. Scan the QR code to run it on a physical device.

A device or emulator cannot reach your machine's `localhost`, so point it at
your LAN address:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npx expo start
```

The Android emulator is handled already: it falls back to `10.0.2.2`, which is
how it reaches the host.

## Demo accounts

Every seeded account uses the password `password123`.

| Email | Role | What they have |
| --- | --- | --- |
| `user1@niwala.test` | Customer | - |
| `user2@niwala.test` | Customer | - |
| `owner1@niwala.test` | Restaurant owner | Bella Napoli, Sakura Ramen |
| `owner2@niwala.test` | Restaurant owner | Taco Libre |

To see both sides of an order, sign in as `user1`, place an order with Bella
Napoli, then sign in as `owner1` to work it through to delivered.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. Nothing secret is committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Matches `docker-compose.yml`. |
| `PORT` | Port the API listens on. Defaults to 4000. |
| `JWT_SECRET` | Signs tokens. Must be at least 16 characters. Use a long random string outside development. |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `30m`, `12h`, `7d`. |

Configuration is validated at startup, so the server refuses to boot on a
missing `DATABASE_URL` or a weak `JWT_SECRET` rather than failing later.

The mobile app reads one optional variable, `EXPO_PUBLIC_API_URL`, described
above.

## Project layout

```
Niwala/
|-- docker-compose.yml        PostgreSQL 16
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma     Six models, two enums
|   |   |-- migrations/       One migration
|   |   +-- seed.ts           Demo data
|   +-- src/
|       |-- lib/              Prisma client, env, JWT, errors, transition table
|       |-- middleware/       authenticate, authorize, validate, error handler
|       |-- routes/           HTTP surface, thin
|       |-- schemas/          Zod request schemas
|       |-- services/         Business rules and every ownership check
|       +-- server.ts
+-- mobile/
    |-- App.tsx               Providers
    +-- src/
        |-- api/              Typed client and endpoints
        |-- auth/             Auth context, AsyncStorage
        |-- cart/             Cart context
        |-- components/       Shared UI
        |-- navigation/       Role-aware navigators
        |-- screens/          auth, customer, owner
        +-- theme/            Colour, spacing, type
```

Routes stay thin. Anything that decides whether an action is allowed lives in
`services/`, so there is one place to read per resource.

## API reference

Every route except register and login needs `Authorization: Bearer <token>`.

**Auth**

| Method | Route | Who |
| --- | --- | --- |
| POST | `/auth/register` | anyone |
| POST | `/auth/login` | anyone |
| GET | `/auth/me` | signed in |

**Restaurants**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/restaurants` | signed in |
| GET | `/restaurants/mine` | owner |
| GET | `/restaurants/:id` | signed in, includes the menu |
| POST | `/restaurants` | owner |
| PATCH | `/restaurants/:id` | owner, must own it |
| DELETE | `/restaurants/:id` | owner, must own it |

**Meals**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/restaurants/:id/meals` | signed in |
| POST | `/restaurants/:id/meals` | owner, must own the restaurant |
| GET | `/meals/:id` | signed in |
| PATCH | `/meals/:id` | owner, must own the parent restaurant |
| DELETE | `/meals/:id` | owner, must own the parent restaurant |

**Orders**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/orders` | customer sees their own, owner sees their restaurants' |
| POST | `/orders` | customer, not blocked |
| GET | `/orders/:id` | the customer who placed it, or the restaurant owner |
| PATCH | `/orders/:id/status` | depends on the transition |

**Users**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/users/customers` | owner |
| PATCH | `/users/:id/blocked` | owner |

Errors share one shape:

```json
{ "error": { "message": "Validation failed", "details": { "price": ["Price must be greater than 0"] } } }
```

## How the rules are enforced

The app never decides whether something is allowed. It hides actions that would
fail, and the API checks again.

**Order totals.** The client sends meal ids and quantities. Nothing else. The
request schema has no field for a price or a total, so a client-supplied amount
is discarded before the service sees it. Prices are read from the database and
summed with `Prisma.Decimal`, never JavaScript floating point. Each line stores
a `unitPrice` snapshot, so repricing a meal later never rewrites a past order.

**One restaurant per order.** Rejected with 400 if the meals span more than one
restaurant. The cart mirrors this and explains itself rather than letting the
conflict surface at checkout.

**Status flow.** One transition table in `lib/order-transitions.ts`:

```
PLACED     -> PROCESSING   restaurant owner
PLACED     -> CANCELED     customer
PROCESSING -> IN_ROUTE     restaurant owner
IN_ROUTE   -> DELIVERED    restaurant owner
DELIVERED  -> RECEIVED     customer
```

Anything absent is refused, which makes the flow forward-only by construction:
nothing leads back into `PLACED`, and `RECEIVED` and `CANCELED` have no exits.
Cancelling too late needs no special case. Four checks, each with its own
answer: an order you cannot see is 404, an illegal transition is 409 and says
which statuses are reachable, the wrong role is 403, and the right role but the
wrong person is 403. The write is a compare-and-set, so two requests racing to
advance one order cannot both win.

**History.** Every change appends a row with its previous status, new status,
timestamp and the user who made it. Nothing is overwritten.

**Ownership.** One assertion per resource, called by every write path, so
changing an id in a request cannot reach data belonging to another owner.
Meals inherit ownership from their restaurant.

**Blocking.** A blocked customer is refused at the API, not by hiding a button.
`authenticate` re-reads the user on every request, so a block applies to tokens
issued before it - no waiting for expiry, no forced logout.

## Assumptions

Where the brief was silent, the simplest reasonable reading was taken.

1. **Blocking is app-wide.** The brief puts a single blocked flag on the user,
   so any owner can set it and it applies everywhere. Per-restaurant blocking
   would need a join table the brief rules out.
2. **A blocked customer can still sign in**, browse, and cancel or receive
   orders already placed. Only new orders are refused.
3. **Role is chosen at registration** rather than defaulting, so an owner
   account is never created by accident.
4. **Browsing requires an account.** The brief describes no logged-out
   experience.
5. **A restaurant that exists but belongs to someone else returns 403, not
   404.** Every restaurant is already listable, so hiding existence would buy
   nothing.
6. **A restaurant cannot be deleted while any order is in flight** - `PLACED`,
   `PROCESSING`, `IN_ROUTE` or `DELIVERED`. `DELIVERED` counts as in flight
   because the customer has not confirmed receipt. Once every order is
   `RECEIVED` or `CANCELED`, deletion is allowed and takes those orders with
   it.
7. **A meal that appears on an order cannot be deleted** - 409 rather than
   silently corrupting order history.
8. **Money is `Decimal(10,2)`** everywhere, never a float.
9. **One line per meal per order.** Repeats are expressed with quantity, and a
   duplicate line is rejected.

## Testing

Verified by exercising the running API and driving the app in a browser, rather
than by unit tests - a deliberate trade-off given the time budget, spending it
on the behaviour a reviewer will check.

The end-to-end pass covers 103 assertions: both full role journeys, and the
failure cases that matter - wrong roles, ownership violations on restaurants,
meals and orders, blocked users, every invalid status transition, cross
restaurant orders, manipulated totals and prices, invalid quantities and ids,
bad authentication, and malformed requests.

Type checking is the fastest signal on both sides:

```bash
cd backend && npx tsc --noEmit
cd mobile && npx tsc --noEmit
```

## Known limitations

- **No automated test suite.** The verification above was run by hand. A real
  project would put those cases in Jest or Vitest and run them in CI.
- **`react-native-web` and `react-dom`** are development conveniences that let
  the app be opened in a browser. They are not needed on a device and can be
  removed.
- **Deleting a restaurant removes its completed orders**, so finished order
  history can disappear for a customer. In-flight orders are protected. Soft
  deletion would be the fix.
- **No refresh tokens, logout endpoint or password reset.** A token stays valid
  until it expires.
- **No pagination.** Lists return everything, which is fine at demo scale.
- **No image uploads.** Restaurants and meals are text only, as specified.
