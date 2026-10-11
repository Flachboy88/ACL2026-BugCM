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
 * Agenda dans lequel on ajoute une activité : le premier agenda coché du panneau.
 * Provisoire, en attendant de choisir l'agenda dans une modale.
 */
function getSelectedAgendaId() {
  const checkbox = document.querySelector('#agenda_list .agenda input:checked');
  return checkbox ? checkbox.closest('.agenda').id : null;
}

/**
 * Gère la création d'une activité lors de la sélection d'un créneau horaire.
 */
async function handleSelect(info) {
  const calendar = info.view.calendar;
  calendar.unselect();

  const idAgenda = getSelectedAgendaId();
  if (idAgenda === null) {
    alert("Créez ou cochez d'abord un agenda");
    return;
  }

  const titre = prompt("Nom de l'activité :");
  if (!titre) return; // Empeche les cas en cas de fermeture fenêtre ou de string null

  // Enregistre l'activité dans l'agenda
  const reponse = await fetch(`/api/agendas/${idAgenda}/activites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      titre, 
      debut: info.start.toISOString(), 
      fin: info.end.toISOString() 
    })
  });

  // Gestion d'erreur
  if (!reponse.ok) {
    const { erreur } = await reponse.json();
    alert(erreur);
    return;
  }

  // Appel de la vue
  calendar.refetchEvents();
}

/**
 * Gère la suppression d'une activité au clic sur celle-ci.
 */
async function handleEventClick(info) {
  const props = info.event.extendedProps;
  let msg = `${info.event.title}`;
  if (props.description) msg += `\n ${props.description}`;

  if (!confirm(`${msg}\n\n Souhaitez-vous supprimer cette activité ?`)) return;

  // Fetch de l'event pour le delete
  const reponse = await fetch(`/api/activites/${info.event.id}`, { method: "DELETE" });

  if (reponse.ok) {
    info.event.remove();
  } else {
    alert("Suppression impossible");
  }
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

    editable: true,
    selectable: true,

    // Handlers des activitées ( creation, suppression, ...)
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
