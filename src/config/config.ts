import { Subscription } from "../entities/subscription";

export const subscriptions: Subscription[] = [
    {
        name: 'Fat bag',
        credentials: {
            email: 'test@hotmail.com',
            password: 'test123'
        },
        creditCard: {
            cardNumber: '1234123412341234',
            expiry: '0725',
            cvc: '123'
        },
        schedule: [
            '2022-05-27 23:00:00',
            '2022-06-10 23:00:00',
            '2022-06-24 23:00:00',
            '2022-07-08 23:00:00',
            '2022-07-22 23:00:00',
            '2022-08-05 23:00:00',
            '2022-08-19 23:00:00',
            '2022-09-02 23:00:00',
            '2022-09-16 23:00:00',
        ],
        products: [
            {
                url: 'https://boutique.pawse.ca/en/big-country-raw-grabngo-raw-deal.html',
                quantity: 1
            },
        ],
    },
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
]