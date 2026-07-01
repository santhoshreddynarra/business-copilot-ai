FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/packages/backend

COPY packages/backend/package*.json ./
RUN npm install

COPY packages/backend/ .
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]
