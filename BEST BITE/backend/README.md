# Backend Architecture

The backend is designed as a scalable REST API layer for BiteBest.

## Purpose

This folder handles server-side logic, data access, request routing, and shared backend services.

## Folder Roles

- `controllers/`
  - Contains functions that process incoming requests, orchestrate business rules, and call model or utility layers.
  - Example responsibilities: calculate comparison results, validate admin actions, format responses.

- `models/`
  - Contains Mongoose schemas and models representing persistent data.
  - Typical entities: restaurants, menu items, delivery fees, packaging fees, offers, platforms, admin users.

- `routes/`
  - Defines Express routes and URL mappings.
  - Keeps route configuration separate from controller logic.

- `middleware/`
  - Contains reusable middleware for authentication, validation, logging, and error handling.
  - Middleware keeps request lifecycle concerns modular and reusable.

- `utils/`
  - Contains small shared helper functions such as formatting, date helpers, or response utilities.
  - Keeps generic utilities separate from business logic.

- `server.js`
  - The application entry point that configures Express, middleware, and routes.
