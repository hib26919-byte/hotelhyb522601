# Bael Tree Hotels

Premium full-stack hotel website for Bael Tree Hotels in Madhapur, Hyderabad, built with React + Vite on the frontend and Firebase-backed workflows with an Express Razorpay helper backend.

## Stack

- `client/`: React 18, Vite, React Router, Firebase, Recharts, Framer Motion, React Hot Toast
- `server/`: Express, Razorpay, CORS, dotenv
- Firestore collections for rooms, bookings, users, gallery, notifications, founders, testimonials, revenue, and settings

## Structure

```text
BaelTreeHotels/
|- client/
|- server/
|- firestore.rules
|- README.md
`- .env.example
```

## Setup

1. Copy environment templates:

```powershell
Copy-Item .env.example .env
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

2. Fill the Vite and server environment variables with your Firebase, ImgBB, and Razorpay keys.

3. Install dependencies:

```bash
npm install --prefix client
npm install --prefix server
```

4. Start the apps in separate terminals:

```bash
npm run dev:client
npm run dev:server
```

5. Open [http://localhost:5173](http://localhost:5173).

## First Admin User

1. Sign up through the public site.
2. Open the Firebase Console.
3. In Firestore, go to `/users/{uid}` for that account.
4. Change `role` from `"user"` to `"admin"`.
5. Refresh the app and the admin dashboard link will appear.

## Firestore Collections

The frontend expects the following collections:

- `rooms`
- `bookings`
- `users`
- `gallery`
- `festivalBanners`
- `notifications`
- `revenue`
- `settings`
- `founders`
- `testimonials`
- `heroImages`
- `inquiries`

The app ships with polished fallback content for rooms, founders, gallery, hero images, and testimonials so the UI remains usable before seeding Firestore.

## Room Seed Data

If you want to seed the canonical room inventory quickly:

1. Sign in as an admin.
2. Open `/admin/rooms`.
3. Edit each fallback room and click `Save Room`.
4. This writes the room into Firestore with the expected category, pricing, and amenities.

That produces:

- Standard Room: 5 rooms, `INR 2500 / INR 3000`
- Executive Room: 55 rooms, `INR 3500 / INR 4000`
- Premium Room: 10 rooms, `INR 4500 / INR 5000`
- Suite Room: 15 rooms, `INR 5500 / INR 6000`

## Firebase Notes

- Deploy Firestore and Storage rules with `firebase deploy --only firestore:rules,storage`.
- If deploying from the Firebase Console, publish `firestore.rules` from the Firestore Rules tab and `storage.rules` from the Storage Rules tab.
- Room videos are uploaded to Firebase Storage from the admin room manager.
- Gallery, room images, and festival banners use the ImgBB helper in the client.

## Razorpay Notes

- The backend exposes:
  - `POST /api/payment/create-order`
  - `POST /api/payment/verify`
  - `POST /api/webhook/razorpay`
- The frontend calls `/api/payment/*` through the Vite proxy during development.

## PWA

The client includes:

- `public/manifest.json`
- `public/sw.js`
- service worker registration in `src/main.jsx`

## Current Scope

This scaffold includes:

- Luxury responsive marketing site
- Auth modal with Firebase email/password and Google sign-in
- Booking modal with Razorpay flow
- User profile and invoice print flow
- Firestore-backed admin dashboard, room management, gallery, festival banners, users, notifications, revenue, and settings

## Recommended Next Steps

- Add real Firebase Cloud Functions for notification fan-out and email delivery
- Attach production-grade server-side auth validation for admin-only backend mutations
- Replace placeholder image URLs with brand-approved hotel photography and founder portraits
- Deploy the client to Firebase Hosting or Vercel and the server to a Node host
