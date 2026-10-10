import { resources, initialEvents } from './events.js';

export function getScrollTime() {
  const h = Math.max(new Date().getHours() - 1, 0);
  return `${String(h).padStart(2, '0')}:00:00`;
}

//init agenda button
export function initAgendaPanel(calendar, panelId){
    //HTML div to display agenda
    const panel = document.getElementById(panelId);

    //catch ressource to display with there params and events
    const displayRessource = r => ({
        id: r.id,
        color: r.eventColor || undefined,
        events: initialEvents.filter(e => e.resourceId === r.id)
    });

    //rebuild 'view' foreach agenda
    resources.forEach(r => {
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
    });
}



export function createCalendar(elementId) {
  const calendarEl = document.getElementById(elementId);

  return new FullCalendar.Calendar(calendarEl, {
    // Clé d'évaluation
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    initialView: 'timeGridWeek',
    locale: 'fr',
    firstDay: 1,
    height: '100%',

    //display indicator on current hour
    nowIndicator: true,
    scrollTime: getScrollTime(),

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek'
    },

    editable: true,
    selectable: true,

    // Chargement des données
    //resources: resources,
    //events: initialEvents,

    // Gestion des clicks pour les activitées
    select(info) {
      const title = prompt('Nom de l\'activité :');
      if (title) {
        this.addEvent({
          title,
          start: info.startStr,
          end: info.endStr,
          allDay: info.allDay,
          resourceId: info.resource ? info.resource.id : null, // Associe à la ressource cliquée
          color: '#3788d8'
        });
      }
      this.unselect();
    },

    // Détails du clic
    eventClick(info) {
      const props = info.event.extendedProps;
      let msg = `📌 ${info.event.title}`;
      if (props.description) msg += `\n ${props.description}`;

      if (confirm(`${msg}\n\nVoulez-vous supprimer cet événement ?`)) {
        info.event.remove();
      }
    },

    //function for today button
    datesSet(){
        this.scrollToTime(getScrollTime());
    }
  });
}
