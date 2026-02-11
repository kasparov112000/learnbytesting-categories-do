#
# BUILD
#
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

#
# RUNTIME
#
FROM node:24-alpine
WORKDIR /app
EXPOSE 3000

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV ENV_NAME=${ENV_NAME}

CMD ["node", "dist/main"]
