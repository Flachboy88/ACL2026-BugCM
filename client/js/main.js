import { createCalendar, initAgendaPanel, addAgendaToPanel } from './calendar.js';

function toPanelAgenda(agenda) {
    return { id: String(agenda.idAgenda), title: agenda.nom, eventColor: agenda.couleur };
}

// Creates and shows the calendar
const calendar = createCalendar('calendar');
calendar.render();

const reponse = await fetch('/api/agendas');
const agendas = await reponse.json();
initAgendaPanel(calendar, 'agenda_list', agendas.map(toPanelAgenda));

const form = document.getElementById('agenda_form');
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // sinon le navigateur recharge la page
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
    // Ajoute seulement le nouvel agenda, sans recharger toute la liste
    addAgendaToPanel(calendar, document.getElementById('agenda_list'), toPanelAgenda(donnees));
    form.reset();
});
