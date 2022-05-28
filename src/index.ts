import cron from 'node-cron';
import { PawsePurchase } from './core/purchase';
import { subscriptions } from './config/config';
import { isSubscriptionDue } from './utils/date';

(async () => {
    // Loop through all subscriptions and create scheduled tasks
    cron.schedule('15 * * * *', () => {
        console.log('Checking if subscriptions are due...');
        for (const subscription of subscriptions) {
            // Check if this subscription should run this day and this hour
            const date = new Date();
            if (isSubscriptionDue(subscription.schedule, date)) {
                console.log(`Subscription "${subscription.name}" is due.`);
                try {
                    const purchase = new PawsePurchase(subscription);
                    purchase.run();
                } catch (err) {
                    console.log(`Failed to run subscription ${subscription.name}.`);
                    console.log(err);
                }
            } else {
                console.log(`Subscription "${subscription.name}" is NOT yet due.`);
            }

        }
    });
    console.log('Service is running...')
})();