FROM node:18

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

COPY . .

# Rebuild to avoid issues
RUN npm rebuild better-sqlite3 --build-from-source

CMD ["node", "src/index.js"]

# Keep the db persistent
VOLUME ["/usr/src/app/data"]