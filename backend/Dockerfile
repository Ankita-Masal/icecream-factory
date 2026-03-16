FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npx prisma migrate deploy || true

EXPOSE 5000

CMD ["node", "server.js"]