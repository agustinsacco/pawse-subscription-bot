module.exports = {
    calendarId: '<<calendar id here>>',
    timezone: 'America/New_York',
    subscriptions: [
        {
            name: 'Bingo Subscription',
            credentials: {
                email: 'test@hotmail.com',
                password: 'test123'
            },
            creditCard: {
                cardNumber: '1234123412341234',
                expiry: '0624',
                cvc: '321'
            },
            products: [
                {
                    url: 'https://boutique.pawse.ca/en/big-country-raw-grabngo-raw-deal.html',
                    quantity: 1
                },
            ],
        }
    ]
}