# Production Dockerfile
FROM node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/.env.tpl ./.env.tpl

RUN npm install --only=production

EXPOSE 8000

ENV PORT=8000

# Install AWS CLI for secrets management
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    gettext-base

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip3 install --no-cache-dir awscli

COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]