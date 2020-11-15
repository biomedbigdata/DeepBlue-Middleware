FROM node:10-alpine as build-step
RUN mkdir -p /deepblue-middleware
WORKDIR /deepblue-middleware
COPY package*.json /deepblue-middleware/
RUN npm install
COPY . /deepblue-middleware/
CMD npm start
