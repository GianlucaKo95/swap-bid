# ---- Build stage --------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage --------------------------------------------------------
# Serves the static build with nginx. Supabase credentials are not baked
# into the build; docker-entrypoint.sh writes them into env-config.js at
# container startup so the same image works for plain Docker and as a
# Home Assistant add-on (reading /data/options.json).
FROM nginx:1.27-alpine

RUN apk add --no-cache jq

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
