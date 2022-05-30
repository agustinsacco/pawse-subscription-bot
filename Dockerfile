FROM node:14-slim AS app

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg chromium -y

WORKDIR /code
COPY . /code
RUN npm i
CMD ["npm", "run", "start:cron"]