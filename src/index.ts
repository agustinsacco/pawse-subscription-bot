import cron from 'node-cron';
import config from '../config.json';
import { PawsePurchase } from './core/purchase';
import { Calendar } from './core/calendar';
import { Subscription } from './entities/subscription';
import { Event } from './entities/event';

const check = async () => {
    // Set time min (beginning of the current hour)
    const timeMin = new Date();
    // Set minutes and beyond to zero to get beginning of hour
    timeMin.setMinutes(0, 0, 0);

    // Set time max (next hour after current)
    const timeMax = new Date();
    // Set hour to next after now and zero everything else
    timeMax.setHours(timeMax.getHours() + 1, 0, 0, 0);

    // Get events using min and max time
    // This gets events in the hour we are currently in
    let calender = new Calendar();
    const events = await calender.listEvents(5, timeMin.toISOString(), timeMax.toISOString());
    console.log('Current events this hour', events.map((e: Event) => {
        return {
            id: e.id,
            summary: e.summary,
            startTime: e.start.dateTime,
            endTime: e.end.dateTime
        }
    }));

    // Run 
    for (const event of events) {
        // Find a subscription for this event
        const subscription = config.subscriptions.find((s: Subscription) => {
            return s.name === event.summary;
        });

        if (subscription) {
            console.log(`-------------- Event and subscription "${subscription.name}" found, starting purchase. -------------`)
            // Run purchase 
            try {
                const purchase = new PawsePurchase(subscription, config.couponCode);
                await purchase.run();
                const msg = `Subscription "${subscription.name}" has ran successfully`;
                console.log(msg);
                await calender.updateEvent(event.id, msg);
            } catch (err) {
                const msg = `Subscription ${subscription.name} failed to run. Error message: ${err.message}`
                console.log(msg);
                await calender.updateEvent(event.id, msg);
            }
            console.log(`-------------- Event and subscription "${subscription.name}" complete. -------------`)
        } else {
            console.log(`No subscription exists for event: "${event.summary}"`)
        }
    }
}

const startCron = async () => {
    try {
        cron.schedule('30 * * * *', async () => {
            await check();
        });
        console.log('Crontab is running...');
    } catch (err) {
        console.log(err);
    }
}

const main = async () => {
    const args = process.argv.slice(2);
    if (args[0] === 'cron') {
        await startCron();
    } else {
        await check();
    }
}

main();