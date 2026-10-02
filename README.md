# Kitarista

Quasar (Vue 3) app in JavaScript with vue-i18n, Pinia and axios, set up for deployment on Vercel.

## Stack

- Quasar CLI with Vite (`@quasar/app-vite`), Sass
- vue-i18n — locales in `src/i18n` (Bulgarian `bg` and English `en-US`), boot file `src/boot/i18n.js`
- Pinia — stores in `src/stores` (`settings-store.js` handles the language switch, `example-store.js` is a sample)
- axios — preconfigured instance in `src/boot/axios.js`
- ESLint + Prettier
- Vercel — `vercel.json` (build to `dist/spa`, SPA rewrites for history-mode routing)

## Requirements

Node.js `^22.12`, `^24` or `>= 26`.

## Install

```bash
npm install
```

## Develop

```bash
cp .env.example .env   # then set QCLI_API_URL
npm run dev
```

## Lint & format

```bash
npm run lint        # fix
npm run lint:check  # check only
```

## Build

```bash
npm run build       # outputs dist/spa
```

## Using axios

```js
import { api } from '@/boot/axios'

const { data } = await api.get('/songs')
```

The base URL is taken from `QCLI_API_URL`. In Options API components you can also use `this.$api` / `this.$axios`.

## Adding a language

1. Create `src/i18n/<locale>/index.js` with the same keys as `en-US`.
2. Register it in `src/i18n/index.js`.
3. Add the Quasar language pack and a label in `src/stores/settings-store.js` and `src/layouts/MainLayout.vue`.

## Deploy to Vercel

Either import the Git repository at <https://vercel.com/new> (settings are read from `vercel.json`), or use the CLI:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Set `QCLI_API_URL` in Vercel → Project Settings → Environment Variables. It is baked in at build time, so redeploy after changing it.
