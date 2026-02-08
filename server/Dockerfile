FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "until pg_isready -h db -p 5432; do sleep 1; done; npx prisma db push && if [ \"$SEED_ON_START\" = \"true\" ]; then npm run seed; fi; npm run start"]
