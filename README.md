# PUB Student Hub (React + Firebase + Stripe)

A student-driven platform for finding roommates, forming groups, splitting expenses, and connecting within the Pundra University community.

Highlights
- Smart matching (same-gender only: male→male, female→female)
- Groups (rooms), expenses, balances, and invites
- Room is created only after invite is accepted
- Gender-locked rooms and gender validation on invites
- Admin dashboard (users, groups, invites, posts, settings) + site-wide announcement banner
- Stripe Checkout for digital “Settle up” payments
- Firebase Auth + Realtime Database + Cloud Functions

Tech stack
- React + Vite
- React Router, Framer Motion, Lucide Icons
- Firebase Auth, Realtime Database, Cloud Functions
- Stripe Checkout (server-side via Cloud Functions)

Directory structure
- src/
  - components/ (Navbar, Modal, Toast, etc.)
  - firebase/
    - firebase.config.js
  - pages/ (Matches, Groups, GroupDetail, Invites, MyProfile, Admin, etc.)
  - utils/ (emailKey, money, rtdbPaths, scoring, etc.)
  - App.jsx, main.jsx, index.css
- functions/ (Firebase Cloud Functions: Stripe integration)
- database.rules.json (Realtime Database rules)
- vite.config.js
- .env.local (client env: Stripe key, allowed domain, etc.)

Features
- Onboarding: Profile + Preferences persist to /profiles, /prefs, and /public
- Matches (same gender only):
  - Filters based on budget/preferences
  - Invite peers to a new room (room is created after acceptance)
- Groups
  - Members, expenses, balances (who owes who)
  - Invite by email to join existing groups (pending until accepted)
  - Gender-locked rooms (male/female) enforce invites for same gender
- Payments
  - Stripe Checkout to settle balances
  - Webhook updates /balances on success and writes /payments history
- Admin
  - Users: make/remove admin, delete user (cleanup)
  - Groups: set gender, remove member, delete group
  - Invites: cancel or force-accept
  - Posts: hide/unhide, delete
  - Settings: site-wide announcement rendered in Navbar

Prerequisites
- Node.js 18+
- Firebase CLI (firebase login && firebase init if needed)
- Stripe account (test mode is fine)



git clone <this-repo>
cd <repo>
npm i
