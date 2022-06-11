import { Calendar } from './core/calendar';

(async () => {
    try {
        const calendar = new Calendar();
        const calendars = await calendar.listCalendars();
        console.log(calendars);
    } catch (err) {
        console.log(err);
    }
})();