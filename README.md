# Job Query

Job Query is a small full-stack app for generating role-specific interview questions. The client is a React + Vite app, and the server is an Express API that calls Gemini to produce three interview questions for a submitted job title.

## Project Structure

```text
job-query/
  client/   React + Vite frontend
  server/   Express API for question generation
```

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm. The current client Vite version will not build on Node 18.
- A Gemini API key

## Setup

Install dependencies in each app folder:

```bash
cd client
npm install

cd ../server
npm install
```

Create a server environment file from the example:

```bash
cp server/.env.example server/.env
```

Then fill in the real API key:

```bash
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Keep real `.env` files local. Commit an `.env.example` file instead if you want to share required variable names.

If Google reports that the API key was leaked, revoke that key, generate a new Gemini API key, and update only your local `server/.env`.

`GEMINI_MODEL` defaults to `gemini-2.5-flash-lite`, the recommended free-tier text model for this app. The previous `gemini-2.0-flash-lite` model is deprecated and scheduled for shutdown on June 1, 2026.

The client defaults to `http://localhost:5000` for API requests. To point it somewhere else, create `client/.env.local`:

```bash
VITE_API_URL=http://localhost:5000
```

## Run Locally

Start the API server:

```bash
cd server
npm run start
```

Start the client in another terminal:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Client Scripts

From `client/`:

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run preview` previews the production build locally.
- `npm run lint` runs ESLint.

## Server Scripts

From `server/`:

- `npm run start` starts the Express API.
- `npm run dev` starts the API with Node watch mode.

## Server Configuration

The API reads these environment variables from `server/.env`:

- `GEMINI_API_KEY` is required for Gemini requests.
- `GEMINI_MODEL` controls the Gemini model and defaults to `gemini-2.5-flash-lite`.
- `PORT` controls the Express port and defaults to `5000`.
- `CLIENT_ORIGIN` controls the allowed browser origin and defaults to `http://localhost:5173`.

## API

`GET /health`

Successful response:

```json
{
  "ok": true,
  "model": "gemini-2.5-flash-lite"
}
```

`POST /api/questions`

Request body:

```json
{
  "jobTitle": "Customer Success Manager"
}
```

Successful response:

```json
{
  "questions": "1. ...",
  "model": "gemini-2.5-flash-lite"
}
```

Error response:

```json
{
  "error": "Job title is required."
}
```
