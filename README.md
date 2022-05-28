# Pawse Bot

## Setup

Configure your subscriptions in:
```
/src/config/config.ts
```

Example:

```json
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
        name: 'Tiny horse',
        schedule: [
            '2022-05-27 20:00:00',
            '2022-06-26 20:00:00',
            '2022-07-26 20:00:00',
            '2022-08-25 20:00:00',
            '2022-09-24 20:00:00',
        ],        products: [
            {
                url: 'https://boutique.pawse.ca/en/karnivor-chicken.html',
                quantity: 1
            },
        ],
    }
```

## Run

```
docker-compose up pawse-bot
```