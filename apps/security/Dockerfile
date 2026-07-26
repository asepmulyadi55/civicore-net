FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/security ./apps/security
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --filter @civicore/security...
RUN pnpm --filter @civicore/security build

FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/apps/security/dist /usr/share/nginx/html
COPY apps/security/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
