import { createCalendar } from './calendar.js';

document.addEventListener('DOMContentLoaded', () => {
  const calendar = createCalendar('calendar');
  calendar.render();
});