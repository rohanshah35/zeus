FROM node:24-bookworm-slim

USER root
WORKDIR /secretary

RUN npm install -g openclaw@latest grammy @grammyjs/runner @grammyjs/transformer-throttler @buape/carbon @larksuiteoapi/node-sdk

COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-package-lock

COPY src ./src
COPY workspace ./workspace
COPY portfolio-tickers.txt ./portfolio-tickers.txt
RUN chown -R node:node /secretary

USER node
CMD ["openclaw", "gateway"]
