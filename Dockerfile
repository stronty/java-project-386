FROM node:22-slim
RUN npm install -g pnpm@11
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV STATIC_DIR=/app/frontend/dist
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/dist/server.js"]
