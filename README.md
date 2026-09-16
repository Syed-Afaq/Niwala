# NIWALA

A food delivery app built for the Innovage.io technical screening.

Two roles share one system. A **customer** browses restaurants, builds a cart,
places an order and follows it to the door. A **restaurant owner** manages
restaurants and menus, works orders through to delivery, and can block a
customer who abuses the service.

```
React Native (Expo) -> REST API -> Express + TypeScript -> Prisma -> PostgreSQL
```

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [API reference](#api-reference)
- [How the rules are enforced](#how-the-rules-are-enforced)
- [Photos](#photos)
- [Assumptions](#assumptions)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Photo credits](#photo-credits)

## Features

**Customers**
- Register and sign in; the session survives restarting the app.
- Browse restaurants as photo-led cards and search them by name or cuisine.
- Open a menu, add dishes, adjust quantities in the cart and place an order.
- Follow an order through Placed, Processing, In Route, Delivered and
  Received, with the time of every step. Cancel while it is still Placed, and
  confirm receipt once it is Delivered.

**Restaurant owners**
- Create, edit and delete restaurants and dishes, each with a photo picked from
  the device.
- See every order placed with their restaurants, grouped by what needs doing,
  and move each one on to its next step.
- Block and unblock customers.

**Throughout**
- Order screens refresh on their own, so a status change made by the other side
  appears within a few seconds, and the Orders tab shows a badge for orders that
  changed since they were last opened.
- Prices in Pakistani rupees (Rs. 1,250).
- Loading placeholders, clear error messages with a retry, and empty states
  that explain what to do next.

## Quick start

You need Docker, Node 18 or newer, and npm.

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

`prisma migrate dev` creates the schema and runs the seed: four demo accounts,
three restaurants and nine dishes, all with photos. To reseed later:

```bash
npm run prisma:seed
```

**3. Start the app**

```bash
cd mobile
npm install
npx expo start
```

Press `w` to open it in a browser, `a` for an Android emulator or `i` for the
iOS simulator, or scan the QR code with Expo Go.

**Running on a phone.** A phone cannot reach your computer through
`localhost`, so tell the app your computer's address on the local network
before starting Expo. The phone must be on the same Wi-Fi.

macOS, Linux or Git Bash:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npx expo start
```

Windows Command Prompt:

```
set "EXPO_PUBLIC_API_URL=http://192.168.1.20:4000" && npx expo start
```

Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"; npx expo start
```

Replace `192.168.1.20` with your own address. The value is built into the app
when Expo starts, so restart Expo after changing it. The Android emulator needs
none of this: it reaches the host through `10.0.2.2` automatically.

## Demo accounts

Every seeded account uses the password `password123`.

| Email | Role | Restaurants |
| --- | --- | --- |
| `user1@niwala.test` | Customer | - |
| `user2@niwala.test` | Customer | - |
| `owner1@niwala.test` | Restaurant owner | Bella Napoli, Sakura Ramen |
| `owner2@niwala.test` | Restaurant owner | Taco Libre |

To see both sides of an order, sign in as `user1` on a phone and as `owner1` in
a browser. Place an order with Bella Napoli, then move it along from the owner
side and watch the customer screen follow.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. No secrets are committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Matches `docker-compose.yml`. |
| `PORT` | Port the API listens on. Defaults to 4000. |
| `JWT_SECRET` | Signs tokens. At least 16 characters; use a long random string outside development. |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `30m`, `12h`, `7d`. |

Configuration is validated at startup, so the server refuses to start with a
missing `DATABASE_URL` or a weak `JWT_SECRET` instead of failing later.

The app reads one optional variable, `EXPO_PUBLIC_API_URL`, described above.

## Project layout

```
Niwala/
|-- docker-compose.yml          PostgreSQL 16
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma       Six models, two enums
|   |   |-- migrations/         Schema history
|   |   +-- seed.ts             Demo accounts, restaurants and dishes
|   |-- uploads/                Restaurant and dish photos, served as static files
|   +-- src/
|       |-- lib/                Prisma client, env, JWT, errors, uploads, status rules
|       |-- middleware/         authenticate, authorize, validate, error handler
|       |-- routes/             HTTP surface, kept thin
|       |-- schemas/            Zod request schemas
|       |-- services/           Business rules and every ownership check
|       +-- server.ts
+-- mobile/
    |-- App.tsx                 Providers
    +-- src/
        |-- api/                Typed client, endpoints, photo upload
        |-- auth/               Session state, persisted with AsyncStorage
        |-- cart/               Cart state
        |-- orders/             Order refreshing and the unseen-changes badge
        |-- components/         Cards, skeletons, status timeline, shared UI
        |-- navigation/         Customer and owner tab navigators
        |-- screens/            auth, customer, owner
        |-- hooks/, lib/        Small helpers: formatting, confirmations, insets
        +-- theme/              Colours, type scale, spacing
```

Routes stay thin. Anything that decides whether an action is allowed lives in
`services/`, so there is one place to read per resource.

**Stack.** Backend: Express, TypeScript, Prisma, PostgreSQL, JWT, bcryptjs, Zod,
multer. Mobile: Expo, React Native, TypeScript, React Navigation, TanStack
Query, AsyncStorage, expo-image-picker. `react-native-web` and `react-dom` are
included so the app also runs in a browser.

## API reference

Every route except register, login and image files needs
`Authorization: Bearer <token>`.

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

Restaurants and meals accept an optional `imageUrl`, which must be a path
returned by the upload route, or `null` to remove the photo.

**Orders**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/orders` | a customer sees their own; an owner sees orders for their restaurants |
| POST | `/orders` | customer, not blocked |
| GET | `/orders/:id` | the customer who placed it, or the restaurant owner |
| PATCH | `/orders/:id/status` | depends on the transition |

**Users**

| Method | Route | Who |
| --- | --- | --- |
| GET | `/users/customers` | owner |
| PATCH | `/users/:id/blocked` | owner |

**Photos**

| Method | Route | Who |
| --- | --- | --- |
| POST | `/uploads/images` | owner; multipart form with one file in the field `image` |
| GET | `/uploads/:file` | anyone; serves the stored image |

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

## Photos

Photos live as files in `backend/uploads/` and are served at `/uploads/...`.
The database stores only the path, never the image itself.

The folder is committed, so a fresh clone shows every photo as soon as the seed
has run - there is nothing to download and no cloud storage to configure.
Photos that owners upload while using the app are saved to the same folder.

Uploads are checked on the server:

- JPEG, PNG or WebP only, up to 5 MB.
- The file content must actually be that type. A text file renamed to `.png`
  is rejected and deleted.
- Files get a random name; the name sent by the phone is never used.
- A restaurant or dish can only point at a path this server created, never at
  an outside URL.

In the app, an owner picks a photo from the device, sees it straight away while
it uploads, and saves the form once the upload has finished. A restaurant or
dish without a photo shows a muted colour chosen from its cuisine with its
initial, so there is never a broken image.

## Assumptions

Where the brief was silent, the simplest reasonable reading was taken.

1. **Blocking is app-wide.** The brief puts a single blocked flag on the user,
   so any owner can set it and it applies everywhere. Per-restaurant blocking
   would need a join table the brief rules out.
2. **A blocked customer can still sign in**, browse, and cancel or receive
   orders already placed. Only new orders are refused.
3. **Role is chosen at registration** rather than defaulting, so an owner
   account is never created by accident.
4. **Browsing requires an account.** The brief describes no signed-out
   experience.
5. **A restaurant that exists but belongs to another owner returns 403, not
   404.** Every restaurant is already listable, so hiding existence would buy
   nothing.
6. **A restaurant cannot be deleted while any order is in progress** - Placed,
   Processing, In Route or Delivered. Delivered counts as in progress because
   the customer has not confirmed receipt. Once every order is Received or
   Canceled, deletion is allowed and takes those orders with it.
7. **A dish that appears on an order cannot be deleted**, so order history is
   never corrupted.
8. **Money is `Decimal(10,2)`** everywhere, never a float, and shown in
   Pakistani rupees.
9. **One line per dish per order.** Repeats are expressed with quantity.
10. **Search runs on the device.** The restaurant list is small and already
    loaded, so filtering it locally needs no extra endpoint.
11. **Live updates use polling.** Order data refreshes every 5 seconds while a
    screen is open, and immediately when the app returns to the foreground.
    WebSockets would be more immediate but would add a server component the
    brief does not need.

## Testing

Verification was done by exercising the running API and driving the app, rather
than with an automated test suite - a deliberate trade-off for the time budget,
spending it on the behaviour a reviewer will check.

- **Backend:** an end-to-end pass of 103 checks covering both role journeys and
  the failure cases that matter - wrong roles, ownership violations on
  restaurants, dishes and orders, blocked users, every invalid status
  transition, cross-restaurant orders, manipulated totals and prices, invalid
  quantities and ids, bad authentication and malformed requests. The photo
  upload route has its own 30 checks, including disguised files, oversized
  files and path tricks.
- **App:** both roles were walked through at phone size - registration, search,
  cart, placing, cancelling and receiving orders, restaurant and dish management
  with photos, order fulfilment and blocking - plus loading placeholders and the
  error and retry path with the network cut off.

Type checking is the fastest signal on both sides:

```bash
cd backend && npx tsc --noEmit
cd mobile && npx tsc --noEmit
```

## Known limitations

- **No automated test suite.** The checks above were run by hand. A real
  project would keep them in Jest or Vitest and run them in CI.
- **Mostly verified in a browser.** The app was driven at phone size in a
  browser and used on a phone, but notch spacing, keyboard behaviour and native
  confirmation dialogs deserve a check on both iOS and Android.
- **Live updates poll every 5 seconds** rather than being pushed.
- **Deleting a restaurant removes its completed orders**, so finished order
  history can disappear for a customer. Orders still in progress are protected.
  Soft deletion would be the fix.
- **Replaced or removed photos stay on disk.** Nothing cleans up files that no
  restaurant or dish points to any more.
- **Uploads are committed with the code.** That keeps the demo photos in the
  repository, but photos uploaded while developing also show up as new files
  in git.
- **No refresh tokens, logout endpoint or password reset.** A token stays valid
  until it expires.
- **No pagination.** Lists return everything, which is fine at demo scale.

## Photo credits

All photos are from [Unsplash](https://unsplash.com) and used under the
[Unsplash License](https://unsplash.com/license), which allows free use without
attribution. They are credited here anyway.

| Photo | Used for | Photographer |
| --- | --- | --- |
| [01](https://unsplash.com/photos/pizza-baking-in-wood-fired-oven-vHRFraV4U00) | Bella Napoli (cover) | Fabrizio Pullara |
| [02](https://unsplash.com/photos/a-bowl-of-ramen-with-chopsticks-and-a-glass-of-beer-mE6kjov4rTg) | Sakura Ramen (cover) | Diego Lozano |
| [03](https://unsplash.com/photos/cooked-tacos-lP5MCM6nZ5A) | Taco Libre (cover) | Chad Montano |
| [04](https://unsplash.com/photos/a-table-filled-with-lots-of-different-types-of-food-YNfDiSsuU_E) | Afaq's kitchen (cover) | Takashi Yamada |
| [11](https://unsplash.com/photos/a-pizza-with-cheese-and-basil-wgq8NVyXsYY) | Margherita Pizza (dish) | Luigi Boccardo |
| [12](https://unsplash.com/photos/cooked-food-on-white-ceramic-plate-qfxAEVCDWiU) | Tagliatelle Bolognese (dish) | Louis Hansel |
| [13](https://unsplash.com/photos/a-piece-of-cake-sitting-on-top-of-a-white-plate-d-Mx494kXAg) | Tiramisu (dish) | Gina's Auckland |
| [14](https://unsplash.com/photos/pasta-dish-on-black-plate-QD9A1O2reYY) | Truffle Pasta (dish) | Jean-claude Attipoe |
| [15](https://unsplash.com/photos/a-bowl-of-ramen-with-meat-eggs-noodles-and-vegetables-NHEL1M1Cv-A) | Tonkotsu Ramen (dish) | Huyen Bui |
| [16](https://unsplash.com/photos/a-white-plate-topped-with-fried-food-on-top-of-a-wooden-table-TTupRwxPgoA) | Chicken Karaage (dish) | Dennis Zhang |
| [17](https://unsplash.com/photos/slice-of-layered-matcha-cake-with-chocolate-drizzle-rcOhNdFL88A) | Matcha Cheesecake (dish) | James Lo |
| [18](https://unsplash.com/photos/beef-tacos-with-onion-and-cilantro-z_PfaGzeN9E) | Carne Asada Tacos (dish) | Jeswin Thomas |
| [19](https://unsplash.com/photos/a-plate-topped-with-a-quesadilla-cut-in-half-_BW-YmENFcM) | Chicken Quesadilla (dish) | Benjamin Guardia |
| [20](https://unsplash.com/photos/food-on-sticks-on-plate-oUvYBNvTec0) | Elote (dish) | Drew Beamer |
| [21](https://unsplash.com/photos/a-pan-filled-with-food-on-top-of-a-wooden-cutting-board-HRamW92xlCI) | Chicken Karahi (dish) | Rimsha Noor |
