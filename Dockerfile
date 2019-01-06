FROM circleci/node:10.15-browsers

USER root
WORKDIR /home/repo

COPY package.json yarn.lock ./
RUN yarn install
COPY . .

CMD yarn test