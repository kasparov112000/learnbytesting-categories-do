#
# BUILD
#
FROM node:18-alpine
WORKDIR /var/app

ADD package.json .
# ADD .npmrc .
RUN npm install
COPY . .
RUN npm run build

#
# UNIT TESTING
#
FROM node:18-alpine

ARG UNIT_TEST=no
WORKDIR /var/app

COPY --from=0 /var/app  /var/app

RUN if [ "${UNIT_TEST}" = "yes" ]; then \
    echo "**** UNIT TESTING ****"; \
    npm test; \
    fi

#
# RUNTIME
#
FROM node:18-alpine
EXPOSE 3000
ENV ENV_NAME=${ENV_NAME}

WORKDIR /var/app

COPY --from=0 /var/app/package.json .
# COPY --from=0 /var/app/.npmrc .
COPY --from=0 /var/app/build .
COPY --from=0 /var/app/docs ./docs/

RUN npm install --production

ENTRYPOINT ["npm", "start"]
