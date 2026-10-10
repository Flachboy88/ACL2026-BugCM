import { createCalendar, initAgendaPanel } from './calendar.js';

// Creates and shows the calendar
const calendar = createCalendar('calendar');
calendar.render();
initAgendaPanel(calendar, 'agenda_list');
