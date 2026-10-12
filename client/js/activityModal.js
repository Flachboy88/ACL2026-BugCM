// Window to create, edit or delete an activity, then save the change with the API

const modal = document.getElementById('activite_modal');
const form = document.getElementById('activite_form');
const modalTitle = document.getElementById('activite_modal_titre');
const titreInput = document.getElementById('activite_titre');
const debutInput = document.getElementById('activite_debut');
const finInput = document.getElementById('activite_fin');
const agendaSelect = document.getElementById('activite_agenda');
const lieuInput = document.getElementById('activite_lieu');
const descriptionInput = document.getElementById('activite_description');
const erreurText = document.getElementById('activite_erreur');
const deleteButton = document.getElementById('activite_supprimer');
const cancelButton = document.getElementById('activite_annuler');

// Calendar to refresh after a change, and activity being edited (null when creating)
let currentCalendar = null;
let editedEvent = null;

// Turns a Date into the "2026-10-12T10:00" text expected by <input type="datetime-local">
function toInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Fills the agenda list with the given agendas ({ id, nom }) and selects one of them
function fillAgendaSelect(agendas, selectedId) {
    agendaSelect.innerHTML = '';
    agendas.forEach(agenda => {
        const option = document.createElement('option');
        option.value = agenda.id;
        option.textContent = agenda.nom;
        agendaSelect.append(option);
    });
    agendaSelect.value = selectedId;
}

// Empties the form and remembers the calendar and the edited activity
function prepareModal(calendar, event) {
    form.reset();
    erreurText.textContent = '';
    currentCalendar = calendar;
    editedEvent = event;
}

// Opens the window to create an activity on the selected time slot
export function openCreateModal(calendar, debut, fin, agendas) {
    prepareModal(calendar, null);
    modalTitle.textContent = 'Nouvelle activité';
    debutInput.value = toInputValue(debut);
    finInput.value = toInputValue(fin);
    fillAgendaSelect(agendas, agendas[0].id);
    agendaSelect.disabled = false;
    deleteButton.hidden = true;
    modal.showModal();
}

// Opens the window to edit a clicked activity (its agenda cannot be changed for now)
export function openEditModal(calendar, event, agendas) {
    prepareModal(calendar, event);
    modalTitle.textContent = "Modifier l'activité";
    titreInput.value = event.title;
    debutInput.value = toInputValue(event.start);
    finInput.value = toInputValue(event.end);
    lieuInput.value = event.extendedProps.lieu ?? '';
    descriptionInput.value = event.extendedProps.description ?? '';
    fillAgendaSelect(agendas, event.source.id);
    agendaSelect.disabled = true;
    deleteButton.hidden = false;
    modal.showModal();
}

// Reads the form into the object sent to the API (empty optional fields become null)
function readForm() {
    return {
        titre: titreInput.value,
        debut: new Date(debutInput.value).toISOString(),
        fin: new Date(finInput.value).toISOString(),
        lieu: lieuInput.value.trim() === '' ? null : lieuInput.value.trim(),
        description: descriptionInput.value.trim() === '' ? null : descriptionInput.value.trim()
    };
}

// Save: POST for a new activity, PUT for an edited one
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // otherwise the browser reloads the page
    let url = `/api/agendas/${agendaSelect.value}/activites`;
    let method = 'POST';
    if (editedEvent !== null) {
        url = `/api/activites/${editedEvent.id}`;
        method = 'PUT';
    }

    const reponse = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readForm())
    });

    // On error the window stays open with the server message
    if (!reponse.ok) {
        const { erreur } = await reponse.json();
        erreurText.textContent = erreur;
        return;
    }
    modal.close();
    currentCalendar.refetchEvents();
});

// Delete (only visible when editing), after a confirmation
deleteButton.addEventListener('click', async function () {
    if (!confirm('Supprimer cette activité ?')) return;

    const reponse = await fetch(`/api/activites/${editedEvent.id}`, { method: 'DELETE' });
    if (!reponse.ok) {
        erreurText.textContent = 'Suppression impossible';
        return;
    }
    modal.close();
    editedEvent.remove();
});

// Cancel closes without saving (the Escape key does the same)
cancelButton.addEventListener('click', function () {
    modal.close();
});
