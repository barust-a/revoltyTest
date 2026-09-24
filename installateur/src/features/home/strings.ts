// User-facing copy for the home screen (spec §3.4 A / maquette Accueil.dc.html).
// Centralised here so no literal ever appears directly in HomeScreen's JSX.
export const HOME_STRINGS = {
  greeting: (name: string) => `Bonjour ${name}`,
  installer: 'Installer',
  calmTitle: (total: number) => `Tes ${total} systèmes vont bien`,
  calmDetail: "Rien d'anormal depuis ta dernière visite.",
  filteredParkLabel: 'Parc filtré par statut de santé',
  todoTitle: 'À faire',
  parkTitle: 'Mon parc',
  emptyTodoTitle: "Rien à faire pour l'instant",
  emptyTodoDetail: "Les manips apparaîtront ici dès qu'une alerte ou Revolty en crée une.",
  seeMore: (n: number) => `Voir les ${n} autres`,
  close: 'Clôturer',
  confirm: 'Confirmer',
  searchPlaceholder: 'Client, ville ou n° de série',
  clearSearch: 'Effacer la recherche',
  noResults: (query: string) => `Aucun système ne correspond à « ${query} »`,
  newBadge: 'Nouveau',
  demoMenu: 'Menu démo',
  recoveryTitle: "Certaines clôtures n'ont pas pu être récupérées",
  recoveryOk: 'OK',
} as const;
