//import { createCalendar } from './calendar.js';

//let calendar = null;

//function initCalendar() {
//    if (calendar) return;               // une seule fois
//    calendar = createCalendar('calendar');
//    calendar.render();
//}

function render() {
  const route = location.hash.slice(2) || 'login';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${route}`)?.classList.add('active');
}
window.addEventListener('hashchange', render);
render();
