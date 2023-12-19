FROM node

WORKDIR /ybr

COPY package.json .

RUN npm install

WORKDIR /ybr/src

COPY src .

WORKDIR /ybr

EXPOSE 80

CMD ["npm", "run", "dev"]