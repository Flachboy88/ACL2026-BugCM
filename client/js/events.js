export const resources = [
    { id: 'a', title: 'Salle Réunion 101', eventColor: '#3788d8' },
    { id: 'b', title: 'Salle Réunion 102', eventColor: '' },
    { id: 'c', title: 'Paul (Développeur)', eventColor: '#28a745' },
    { id: 'd', title: 'Sophie (Designer)', eventColor: '#6f42c1' },
    { id: 'e', title: 'TEST A', eventColor: '' },
    { id: 'f', title: 'TEST B', eventColor: '#6f42ff' },
    { id: 'g', title: 'TEST C', eventColor: '' },
    { id: 'h', title: 'TEST D', eventColor: '' }
];

export const initialEvents = [
  {
    id: '1',
    resourceId: 'a', // Salle 101
    title: "Réunion d'équipe",
    start: '2026-10-04T09:00:00',
    end: '2026-10-04T11:00:00',
    extendedProps: {
      location: 'Salle 101',
      description: 'Point d\'avancement de la semaine'
    }
  },
  {
    id: '2',
    resourceId: 'c', // Paul
    title: 'Développement API',
    start: '2026-10-04T10:00:00',
    end: '2026-10-04T16:00:00',
    extendedProps: {
      description: 'Implémentation des endpoints Premium'
    }
  },
  {
    id: '3',
    resourceId: 'd', // Sophie
    title: 'Maquettes UI/UX',
    start: '2026-10-04T14:00:00',
    end: '2026-10-04T18:00:00',
    extendedProps: {
      description: 'Design du composant calendrier'
    }
  },
    {
    id: '4',
    resourceId: 'd', // Sophie
    title: 'Maquettes UI/UX',
    start: '2026-10-14T14:00:00',
    end: '2026-10-14T18:00:00',
    extendedProps: {
      description: 'Design du composant calendrier'
    }
  },
  {
    id: '5',
    resourceId: 'a', // Sophie
    title: 'Maquettes UI/UX',
    start: '2026-10-15T14:00:00',
    end: '2026-10-15T18:00:00',
    extendedProps: {
      description: 'Design du composant calendrier'
    }
  },
    {
    id: '6',
    resourceId: 'f', 
    title: 'Maquettes UI/UX',
    start: '2026-10-15T14:00:00',
    end: '2026-10-15T18:00:00',
    extendedProps: {
      description: 'Design du composant calendrier'
    }
  },
      {
    id: '7',
    resourceId: 'f', 
    title: 'AAAAAAAAAAAAAAA',
    start: '2026-10-16T14:00:00',
    end: '2026-10-16T18:00:00',
    extendedProps: {
      description: 'Design du composant calendrier'
    }
  }
];
