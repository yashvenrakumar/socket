# Socket Frontend

A modern React application built with Vite, TypeScript, and React Router.

## Features

- ⚡ **Vite** - Fast build tool and dev server
- 📘 **TypeScript** - Type-safe development
- 🛣️ **React Router** - Client-side routing
- 🎨 **Modern UI** - Clean and responsive design

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   └── Layout.tsx
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── App.tsx         # Main app component with routes
│   ├── App.css         # App styles
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Available Routes

- `/` - Home page
- `/about` - About page

## API Proxy

The Vite dev server is configured to proxy API requests to `http://localhost:8000`. All requests to `/api/*` will be forwarded to the backend server.
