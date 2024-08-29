FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env .env

RUN npm run build

EXPOSE 80

ENV PORT=80

CMD ["node", "dist/index.js"]