// Structure de navigation "Filières" — vitrine uniquement (affichage), ne
// touche pas au catalogue réel (filières/niveaux en base, utilisé pour la
// pré-inscription et les tarifs). Chaque programme renvoie vers /pre-inscription.
//
// BT et BTS reprennent les mêmes spécialités que les Licences (même filière,
// niveau de diplôme différent) — à corriger si les intitulés réels diffèrent.
export const DEPARTEMENTS = [
  {
    id: 'genie-info',
    nom: 'Département Génie-Informatique',
    bt: ['Génie Logiciel', 'Infographie et Multimédia', 'Informatique de Gestion'],
    bts: ['Génie Logiciel', 'Infographie et Multimédia', 'Informatique de Gestion'],
    licences: [
      'Génie Logiciel',
      'Infographie et Multimédia',
      'Informatique de Gestion',
      "Géomatique et Développement d'Application",
      'Marketing et Communication Digitale',
    ],
    masters: ['Génie Logiciel', 'Informatique de Gestion'],
    ingenieur: 'Cycle Ingénieur en Génie Informatique',
  },
  {
    id: 'reseaux-systemes',
    nom: 'Département Réseaux & Systèmes',
    bt: ['Réseaux Informatiques', 'Réseaux Télécoms'],
    bts: ['Réseaux Informatiques', 'Réseaux Télécoms', 'Cyber Sécurité'],
    licences: [
      'Réseaux Informatiques',
      'Réseaux Télécoms',
      'Cyber Sécurité',
      'Systèmes Embarqués et IoT',
      'Énergies Renouvelables',
    ],
    masters: [
      'Réseaux & Systèmes Informatiques',
      'Réseaux Télécommunications',
      "Sécurité des Systèmes d'Informations et Monétiques",
      'Virtualisation et Cloud Computing',
    ],
    ingenieur: 'Cycle Ingénieur en Réseaux & Systèmes',
  },
  {
    id: 'ia-data',
    nom: 'Département Intelligence Artificielle et Ingénierie de Données',
    bt: [],
    bts: ['Data Science & Big Data'],
    licences: ['Bachelor en Data Science & Big Data'],
    masters: [],
    ingenieur: 'Cycle Ingénieur en Intelligence Artificielle',
  },
  {
    id: 'gestion',
    nom: 'Département Gestion',
    bt: ['Comptabilité', 'Commerce International'],
    bts: ['Finance & Comptabilité', 'Commerce International', 'Banque Finance'],
    licences: ['Finance & Comptabilité', 'Commerce International', 'Banque Finance'],
    masters: [],
    ingenieur: null,
  },
]
