FROM node:14-slim AS app

WORKDIR /code
COPY . /code
RUN npm i
CMD ["npm", "run", "start:cron"]