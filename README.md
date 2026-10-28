# Launchpad Flow Beacon

You are building the frontend for a web application during a hackathon. 

SETUP & ARCHITECTURE RULES:

1. Tech Stack: Use React (Vite/Next.js), Tailwind CSS, and Lucide icons.

2. Separation of Concerns: Keep pure visual UI components separate from backend network requests. Put ALL API calls inside a single file: `src/lib/api.ts` (or `api.js`). 

3. Dynamic Backend URL: Store the backend base URL using environment variables (`import.meta.env.VITE_API_BASE_URL` or `process.env.NEXT_PUBLIC_API_URL`). Fallback to `http://localhost:8000` if the variable is not set.

4. Demo-Mode / Mock Switch: In `api.ts`, add a global boolean toggle `const USE_MOCK = true;`. 

   - When `USE_MOCK` is true, simulate backend network delays (1000ms) and return realistic dummy data.

   - When `USE_MOCK` is false, make real `fetch` network calls to the backend endpoints.

CURRENT BACKEND API CONTRACT:

[Paste your agreed JSON input/output shapes or backend endpoints here. Example: POST /api/submit expects { query: string }, returns { result: string }]

TASK:

Build the UI structure and initial pages with modern, clean styling. Wrap all async action triggers with clear UI loading states (spinners/skeleton loaders) and error notification toasts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1bbb1d8c-7b90-5f35-ba92-7faeec3e2a5b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
