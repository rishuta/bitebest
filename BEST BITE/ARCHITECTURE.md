# BiteBest Architecture

This document describes the scalable architecture for the BiteBest food comparison platform.

## Project Overview

- **Frontend:** Next.js + TypeScript + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Deployment:** Vercel for frontend, Railway for backend

+
## Folder Structure

### `frontend/`
Contains the user-facing web application.
- `app/` - Next.js app routes and page layout.
- `components/` - Reusable UI components for cards, forms, navigation, and shared view logic.
- `lib/` - Shared frontend utilities, API clients, and feature helpers.
- `public/` - Static assets such as images and icons.
- `styles/` (optional) - Shared Tailwind or CSS utility files if needed.

### `backend/`
Contains the API server, request handling, and data layer.
- `controllers/` - Request handlers for each endpoint, containing business orchestration logic.
- `models/` - Mongoose schemas and models for domain entities (users, restaurants, menu items, comparisons, admin data, etc.).
- `routes/` - Express route definitions that map HTTP endpoints to controllers.
- `middleware/` - Reusable middleware for authentication, validation, error handling, and request preprocessing.
- `utils/` - Shared backend helpers, formatting utilities, and small reusable functions.
- `server.js` - API server entry point.

### `database/`
Contains database-related resources.
- `seed/` - Seeding scripts, fixtures, or sample data for local development.
- `README.md` - Notes for how database setup and migrations should be managed.

## Scalable Design Principles

- Separate concerns by layer: routes, controllers, models, middleware, and utilities.
- Keep UI components reusable in `frontend/components/` and shared business helpers in `frontend/lib/`.
- Store environment-specific configuration separately from code.
- Use `database/` for database scripts and data setup without mixing it into application logic.

## Next Steps

- Build API routes and controllers with clear input/output boundaries.
- Add database models and migration/seed scripts.
- Implement frontend page layouts using composable components.
- Keep backend functionality decoupled from frontend display concerns.
