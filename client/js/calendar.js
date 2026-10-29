import { openCreateModal, openEditModal } from './activityModal.js';
import { openAgendaModal } from './agendaModal.js';

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
 * Parser for fullcalendar API
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
 * Agendas checked on agenda_panel ({ id, nom })
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
 * Selection of a time slot : open modal window of activity creation
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
 * Click on a activity : open modal window for the modification and supression
 */
function handleEventClick(info) {
  openEditModal(info.view.calendar, info.event, getCheckedAgendas());
}


/**
 * Initialize and configurate FullCalendar.
 */
export const mobile = window.matchMedia('(max-width: 768px)');

const DAY_FORMAT = isMobile => ({ weekday: isMobile ? 'short' : 'long', day: 'numeric' });

export function createCalendar(elementId) {
  const calendarEl = document.getElementById(elementId);

  const calendar = new FullCalendar.Calendar(calendarEl, {
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    // View and calendar config
    initialView: mobile.matches ? 'timeGridDay' : 'timeGridWeek',
    locale: 'fr',
    firstDay: 1,
    height: '100%',
    dayHeaderFormat: DAY_FORMAT(mobile.matches),
    titleFormat: { month: 'long', year: 'numeric' },
    headerToolbar: false,
    views: {
        timeGridDay: { dayHeaderFormat: { weekday: 'long', day: 'numeric' } },
        dayGridMonth: { dayHeaderFormat: { weekday: 'short' } },
        timeGrid4Day: {
            type: 'timeGrid',
            duration: { days: 4 },
            buttonText: '4 jours',
            dayHeaderFormat: { weekday: 'short', day: 'numeric' }
        }
    },

    allDayText: 'Journée entière',

    // Navigation & temps
    nowIndicator: true,
    scrollTime: getScrollTime(),

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

    //rotation & resizing => adpat the display without recreate it
    mobile.addEventListener('change', e => {
        calendar.changeView(e.matches ? 'timeGridDay' : 'timeGridWeek');
        calendar.setOption('dayHeaderFormat', DAY_FORMAT(e.matches));
    });

    return calendar;
}

// Event source of one agenda: FullCalendar fetches its activities for the displayed period
const displayRessource = r => ({
    id: r.id,
    url: `/api/agendas/${r.id}/activites`,
    color: r.eventColor || undefined,
    eventDataTransform: transformEvent
});

// Reloads the agenda's activities with its new color (only if it is currently shown)
function refreshEventSource(calendar, cb, r) {
    if (!cb.checked) return;
    calendar.getEventSourceById(r.id)?.remove();
    calendar.addEventSource(displayRessource(r));
}

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

    // Pencil: opens the edit window; its click must not toggle the checkbox
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'agenda_edit';
    edit.setAttribute('aria-label', "Modifier l'agenda");
    edit.textContent = '✎';
    edit.addEventListener('click', e => {
        e.stopPropagation();
        openAgendaModal(r, modifie => {
            // Mise à jour du panneau et du calendrier sans recharger
            r.title = modifie.nom;
            r.eventColor = modifie.couleur;
            r.description = modifie.description;
            label.textContent = r.title;
            div.style.setProperty('--agenda-color', r.eventColor || '#94a3b8');
            cb.style.accentColor = r.eventColor;
            refreshEventSource(calendar, cb, r);
        });
    });

    div.append(cb, label, edit);
    panel.append(div);

    div.classList.add('agenda');
    div.id = r.id;
    div.style.setProperty('--agenda-color', r.eventColor || '#94a3b8');
    div.addEventListener('click', e => {
        if (e.target !== cb && e.target !== edit) cb.click();
    });
    cb.style.accentColor = r.eventColor;

}
