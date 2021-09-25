#FROM node:14.15-alpine as yarn-container
#
#RUN npm install -g yarn

FROM node:14.15-alpine

ENV NODE_ENV production
WORKDIR /app
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn install
RUN yarn add reflect-metadata rxjs @angular/core zone.js
RUN apk add libnotify
COPY out-tsc /app/out-tsc

EXPOSE 13308

CMD [ "node", "/app/out-tsc/backend/src/main.js" ]
