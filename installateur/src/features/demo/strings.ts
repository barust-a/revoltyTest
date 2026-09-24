// User-facing copy for the demo menu (route /demo). Never referenced by the real flows —
// this screen only exists to stage the terrain for the demonstration.
export const DEMO_STRINGS = {
  title: 'Menu démo',
  intro: 'Ces boutons simulent le terrain pour la démonstration.',
  toggleOffline: 'Simuler hors ligne',
  toggleOfflineOn: "Actuellement hors ligne · les clôtures s'accumulent avant l'envoi.",
  toggleOfflineOff: 'Actuellement en ligne · tout se synchronise normalement.',
  failNextSend: 'Faire échouer le prochain envoi',
  failNextSendDetail: 'Le prochain envoi de clôture échouera, puis pourra être réessayé.',
  outage: 'Coupure à Bron',
  outageDetail: '7 systèmes de Bron passent sans nouvelles (scénario de coupure).',
  bringBack: 'Faire revenir la panne de Mme Petit',
  bringBackDetail: 'Rouvre son alerte pour montrer la règle « Rouverte ».',
  reset: 'Réinitialiser la démo',
  resetDetail: 'Efface tout et repart des données de démo initiales.',
} as const;
