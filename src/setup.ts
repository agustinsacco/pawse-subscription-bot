import { Calendar } from './core/calendar';

(async () => {
    const calendar = new Calendar();
    const calendars = await calendar.listCalendars();
    console.log(calendars);
})();