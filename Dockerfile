FROM node:10.16.0-alpine

RUN mkdir xrp-api
WORKDIR /xrp-api
ADD . /xrp-api

RUN npm install -g -s --no-progress yarn
RUN yarn
RUN yarn run build
RUN yarn cache clean

EXPOSE 3000

CMD ["yarn", "dev"]
