import { resources, initialEvents } from './events.js';

export function createCalendar(elementId) {
  const calendarEl = document.getElementById(elementId);

  return new FullCalendar.Calendar(calendarEl, {
    // Clé d'évaluation 
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    initialView: 'resourceTimelineWeek',
    locale: 'fr',

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'resourceTimelineDay,resourceTimelineWeek,dayGridMonth,listWeek'
    },

    editable: true,
    selectable: true,

    // Chargement des données
    resources: resources,
    events: initialEvents,

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
    }
  });
}