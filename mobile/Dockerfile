FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY App.tsx ./
COPY app.json ./
COPY babel.config.js ./
COPY tsconfig.json ./
COPY src ./src

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan"]