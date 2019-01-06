FROM node:10.15.0-slim

# borrows from https://github.com/buildkite/docker-puppeteer
RUN apt-get update \
    && apt-get install -yq libgconf-2-4 \
    && apt-get install -y wget procps --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/repo
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
