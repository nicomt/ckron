FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /opt/ckron
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm install --global

ENTRYPOINT [ "ckron" ]

CMD ["daemon", "--config", "/etc/ckron/config.yml"]
