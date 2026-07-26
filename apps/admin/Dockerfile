FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --filter @civicore/admin...
RUN pnpm --filter @civicore/admin build

FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
