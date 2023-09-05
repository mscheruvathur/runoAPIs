FROM node:18.16.0-alpine

WORKDIR /runo

COPY package*.json .

RUN npm install -g ts-node

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD [ "npm","run","dev" ]