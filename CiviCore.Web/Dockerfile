FROM node:20-alpine
WORKDIR /app
RUN chown -R node:node /app
USER node
ARG API_URL
ENV API_URL=${API_URL}
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
COPY --chown=node:node *.ts *.mjs *.json ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
