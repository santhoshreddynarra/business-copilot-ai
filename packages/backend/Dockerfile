FROM node:20-alpine

WORKDIR /app/packages/backend

COPY packages/backend/package*.json ./
RUN npm install

COPY packages/backend/ .
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]
