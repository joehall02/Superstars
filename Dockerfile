# Production-like local testing image.
#
# Uses the dev/local data path rather than production: the master spreadsheet
# is converted to JSON at build time and the app is built with
# VITE_DATA_SOURCE=local, so the served bundle fetches /data/master-scores.json
# instead of the Vercel serverless API. Nginx then serves the static build.

# ── Stage 1: build the app ───────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

# Skip Husky's git-hook install — there's no .git in the build context.
ENV HUSKY=0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `vite build` auto-loads .env.production for its VITE_-prefixed vars (e.g.
# VITE_GCS_PUBLIC_BASE_URL); non-VITE_ secrets are never inlined, and the file
# stays out of the final Nginx stage.
#
# VITE_DATA_SOURCE is forced to `local` (overriding the .env file, which sets
# `api` for production): the real env var wins, so the bundle reads the JSON that
# convert-data writes to public/data/ (vite build copies it into dist/data/).
ENV VITE_DATA_SOURCE=local
RUN npm run convert-data
RUN npm run build

# ── Stage 2: serve the static build ──────────────────────────────────────────
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
