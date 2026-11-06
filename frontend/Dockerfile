FROM node:20-alpine

WORKDIR /app

# Fijamos una versión específica de pnpm (puedes ajustar el número a la versión exacta que uses localmente)
RUN npm install -g pnpm@9.12.2

COPY package*.json pnpm-lock.yaml ./

# Usamos --frozen-lockfile para garantizar que no se instalen versiones sorpresa
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


 