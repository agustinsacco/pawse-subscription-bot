import cron from 'node-cron';
import { PawsePurchase } from './core/purchase';
import { subscriptions } from './config/config';
import { isSubscriptionDue } from './utils/date';

(async () => {
    // Loop through all subscriptions and create scheduled tasks
    const subscription = {
        credentials: {
            email: 'saccoagustin@hotmail.com',
            password: 'agustin753651'
        },
        creditCard: {
            cardNumber: '5524890012961751',
            expiry: '0725',
            cvc: '787'
        },
        name: 'Tiny horse',
        schedule: [
            '2022-05-27 22:00:00',
            '2022-06-26 22:00:00',
            '2022-07-26 22:00:00',
            '2022-08-25 22:00:00',
            '2022-09-24 22:00:00',
        ],
        products: [
            {
                url: 'https://boutique.pawse.ca/en/karnivor-chicken.html',
                quantity: 1
            },
        ],
    }
    console.log('Running purchase...')
    const purchase = new PawsePurchase(subscription);
    purchase.run();
})();