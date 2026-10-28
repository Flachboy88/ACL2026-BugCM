import { createCalendar, initAgendaPanel, addAgendaToPanel, mobile } from './calendar.js';

function toPanelAgenda(agenda) {
    return { id: String(agenda.idAgenda), title: agenda.nom, eventColor: agenda.couleur };
}

// Creates and shows the calendar
const calendar = createCalendar('calendar');

// control of the view
calendar.on('datesSet', info => {
    const radio = document.querySelector(`#choix_vue input[value="${info.view.type}"]`);
    if (radio) radio.checked = true;
    //title of calendar take first month of the curent display
    const titre = info.view.currentStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    document.getElementById('calendar_month').textContent = titre.charAt(0).toUpperCase() + titre.slice(1);
});

calendar.render();

const reponse = await fetch('/api/agendas');
const agendas = await reponse.json();
initAgendaPanel(calendar, 'agenda_list', agendas.map(toPanelAgenda));

const form = document.getElementById('agenda_form');
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // prevent navigator to recharge the page
    const erreur = document.getElementById('agenda_erreur');
    erreur.textContent = '';

    const reponse = await fetch('/api/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nom: document.getElementById('agenda_nom').value,
            couleur: document.getElementById('agenda_couleur').value
        })
    });
    const donnees = await reponse.json();
    if (!reponse.ok) {
        erreur.textContent = donnees.erreur;
        return;
    }
    // Add an element on the calendar without re-charge everything
    addAgendaToPanel(calendar, document.getElementById('agenda_list'), toPanelAgenda(donnees));
    form.reset();
});

// Menu burger
const bt_burger = document.getElementById('burger');
const container = document.getElementById('container');
const overlay   = document.getElementById('overlay');

function setMenu(ouvert) {
    container.classList.toggle('reduce', !ouvert);
    bt_burger.setAttribute('aria-expanded', ouvert);
}

// État initial : fermé sur mobile, ouvert sur ordi
setMenu(!mobile.matches);

bt_burger.addEventListener('click', () => setMenu(container.classList.contains('reduce')));
overlay.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

//resize the calendar when the display area change
new ResizeObserver(() => calendar.updateSize()).observe(document.getElementById('calendar'));

// Choie of view
document.getElementById('choix_vue').addEventListener('change', e => {
    calendar.changeView(e.target.value);
    if (mobile.matches) setMenu(false);
});

// control button on calendar header
document.getElementById('prev').addEventListener('click', function() { calendar.prev(); });
document.getElementById('next').addEventListener('click', function() { calendar.next(); });
document.getElementById('today').addEventListener('click', function() { calendar.today(); });


//Button '+' simulate a click on the calendar
document.getElementById('ajout_activite').addEventListener('click', () => {
    const debut = calendar.getDate();
    debut.setHours(new Date().getHours() + 1, 0, 0, 0);
    const fin = new Date(debut.getTime() + 60 * 60 * 1000);
    calendar.select(debut, fin);
});



//Swipe left and right on calendar
const swipeZone = document.getElementById('calendar');
let start = null;

swipeZone.addEventListener('touchstart', e => {
    if ( e.touches.length !== 1) {
        start = null;
        return;
    }
    const t = e.touches[0];
    start = { x:t.clientX, y:t.clientY, temps: Date.now() };
}, {passive:true});

swipeZone.addEventListener('touchend', e => {
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const f = Date.now() - start.temps < 600;
    start = null;

    if (f && Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
        if (dx < 0) calendar.next();
        else        calendar.prev();
    }
},{passive:true});
