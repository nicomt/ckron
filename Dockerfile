FROM node:14-alpine

COPY . /opt/ckron
RUN npm install --production -g /opt/ckron

ENTRYPOINT [ "ckron" ]

CMD ["daemon", "--config", "/etc/ckron/config.yml"]
