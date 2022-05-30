# Pawse Bot

## Setup

### Dependencies
```
npm i
```

### Google Calendar API

1. Navigate to GCP console and enable Google Calendar API
2. Navigate to credentials and setup **OAuth consent screen** and create a **OAuth cliend ID**. Download the credentials JSON file and paste it in the root of the repo with the name: ```./credentials.json```
3. Run to setup oauth token. You will need to copy the token from the URL and paste it in your terminal.  
```npm run setup```  
This will also display the current calendars in the account. Find the calendar you will like to use and save it's ID.
4. Google API is now ready to accept requests.

### Setup Configs

Configs are located: ```./config/default.js```

1. Configure your calendar ID and timezone.
2. Configure your subscriptions. Example below.

```
{
    credentials: {
        email: 'test@hotmail.com',
        password: 'test123'
    },
    creditCard: {
        cardNumber: '1234123412341234',
        expiry: '0725',
        cvc: '123'
    },
    name: 'Bingo Subscription',   
    products: [
        {
            url: 'https://boutique.pawse.ca/en/karnivor-chicken.html',
            quantity: 1
        },
    ],
}
```

Considerations:
* Multiple events can run in the same hour. Each order will be done in sequence.
* The name of the subscription should match the Google Calendar event name exactly.
* The event will receive an update in the description with success/failure of the order.

## Run manual locally

** Use this to test and validate your setup. It will check for events in the current hour and if subscriptions match, it will run a purchase. (Tip: change your credit card number for an invalid one so purchases do not go through.)

```
npm start
```

## Run cron locally

```
npm run start:cron
```

## Run cron in docker

** Use this to run the worker long term.

```
docker-compose up pawse-bot
```