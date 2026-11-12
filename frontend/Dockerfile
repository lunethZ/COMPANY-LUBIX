FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# Copy only the files needed to run the dev server (no .env, .git, node_modules, etc.)
COPY ./index.html /app/index.html
COPY ./vite.config.ts /app/vite.config.ts
COPY ./tsconfig.json /app/tsconfig.json
COPY ./tsconfig.app.json /app/tsconfig.app.json
COPY ./tsconfig.node.json /app/tsconfig.node.json
COPY ./tailwind.config.js /app/tailwind.config.js
COPY ./postcss.config.cjs /app/postcss.config.cjs
COPY ./eslint.config.js /app/eslint.config.js
COPY ./src /app/src

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
