import { openCreateModal, openEditModal } from './activityModal.js';

export function getScrollTime() {
  const h = Math.max(new Date().getHours() - 1, 0);
  return `${String(h).padStart(2, '0')}:00:00`;
}

//init agenda button
export function initAgendaPanel(calendar, panelId, agendas){
    //HTML div to display agenda
    const panel = document.getElementById(panelId);
    //rebuild 'view' foreach agenda
    agendas.forEach(r => addAgendaToPanel(calendar, panel, r));
}

/**
 * Parser pour l'API FullCalender
 */
function transformEvent(activite) {
  return {
    id: String(activite.idActivite),
    title: activite.titre,
    start: activite.debut,
    end: activite.fin,
    extendedProps: { 
      lieu: activite.lieu, 
      description: activite.description 
    }
  };
}

/**
 * Agendas cochés dans le panneau ({ id, nom }) : ceux qu'on peut choisir dans la fenêtre d'activité.
 */
function getCheckedAgendas() {
  const agendas = [];
  document.querySelectorAll('#agenda_list .agenda').forEach(div => {
    if (div.querySelector('input').checked) {
      agendas.push({ id: div.id, nom: div.querySelector('label').textContent });
    }
  });
  return agendas;
}

/**
 * Sélection d'un créneau : ouvre la fenêtre de création d'une activité.
 */
function handleSelect(info) {
  const calendar = info.view.calendar;
  calendar.unselect();

  const agendas = getCheckedAgendas();
  if (agendas.length === 0) {
    alert("Créez ou cochez d'abord un agenda");
    return;
  }
  openCreateModal(calendar, info.start, info.end, agendas);
}

/**
 * Clic sur une activité : ouvre la fenêtre de modification (avec le bouton Supprimer).
 */
function handleEventClick(info) {
  openEditModal(info.view.calendar, info.event, getCheckedAgendas());
}

/**
 * Initialise et configure FullCalendar.
 */
export function createCalendar(elementId) {
  const calendarEl = document.getElementById(elementId);

  return new FullCalendar.Calendar(calendarEl, {
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    // Config visuelle et locale
    initialView: 'timeGridWeek',
    locale: 'fr',
    firstDay: 1,
    height: '100%',

    // Navigation & temps
    nowIndicator: true,
    scrollTime: getScrollTime(),

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek'
    },

    // Glisser-déposer désactivé : il n'est pas encore enregistré (prévu au sprint suivant)
    editable: false,
    selectable: true,

    // Handlers des activitées (création, modification, suppression)
    // Les événements viennent des sources ajoutées par addAgendaToPanel (une par agenda)
    select: handleSelect,
    eventClick: handleEventClick,

    datesSet() {
      this.scrollToTime(getScrollTime());
    }
  });
}

// Event source of one agenda: FullCalendar fetches its activities for the displayed period
const displayRessource = r => ({
    id: r.id,
    url: `/api/agendas/${r.id}/activites`,
    color: r.eventColor || undefined,
    eventDataTransform: transformEvent
});

export function addAgendaToPanel(calendar, panel, r) {
    calendar.addEventSource(displayRessource(r));

    const div = document.createElement('div');
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
        if (cb.checked) calendar.addEventSource(displayRessource(r));
        else calendar.getEventSourceById(r.id)?.remove();
    });
    label.append(r.title);
    div.append(cb, label);
    panel.append(div);

    div.classList.add('agenda');
    div.id = r.id;
    div.style.setProperty('--agenda-color', r.eventColor || '#94a3b8');
    div.addEventListener('click', e => {
        if (e.target !== cb) cb.click();
    });
    cb.style.accentColor = r.eventColor;

}
