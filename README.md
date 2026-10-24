# openNotes — MERN-style project

openNotes is a student study-notes sharing application. This version uses a standard Vite + React single-page frontend and an Express + Node.js API with MongoDB/Mongoose.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

1. Extract the ZIP and open the `opennotes-mern` folder in VS Code.
2. Install packages:

   ```bash
   npm install
   ```

3. Create your local environment file by copying `.env.example` to `.env`.
4. Set `MONGODB_URI` to your local MongoDB URI or MongoDB Atlas connection string.
5. Replace `JWT_SECRET` with a long, random secret. Do not share or commit `.env`.
6. Start the application:

   ```bash
   npm run dev
   ```

The React frontend normally opens at `http://localhost:5173`. The Express API runs at `http://localhost:5000`.

## Useful commands

- `npm run dev` — starts the API and frontend together
- `npm run server` — starts only the Express API
- `npm run dev:client` — starts only the frontend
- `npm run build` — builds the frontend
- `npm test` — runs the included tests
- `npm run seed` — runs the database seed script

Check API health at `http://localhost:5000/api/health`.

## MongoDB setup

For a local MongoDB installation, the default example URI is:

`mongodb://127.0.0.1:27017/opennotes`

For MongoDB Atlas, copy the connection string from your Atlas project into `MONGODB_URI`. Make sure the database user's permissions and network access are configured.

## Notes

- The original archive's `.env` file is intentionally not included in this converted ZIP so private credentials are not redistributed. Use `.env.example` to create your own.
- The frontend has been switched away from the TanStack Start application entry to a conventional Vite + React entry. It still uses TanStack Router for client-side navigation.
- The original Express API, Mongoose models, and API routes have been retained.
- A successful local run depends on installing packages and configuring a reachable MongoDB database. The conversion environment did not complete dependency installation, so please run the build and startup commands locally and share any error output for troubleshooting.
