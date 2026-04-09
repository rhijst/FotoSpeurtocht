FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY init.js .

CMD ["node", "init.js"]