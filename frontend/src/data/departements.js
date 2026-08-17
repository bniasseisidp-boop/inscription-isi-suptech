// Structure de navigation "Filières" — vitrine uniquement (affichage), ne
// touche pas au catalogue réel (filières/niveaux en base, utilisé pour la
// pré-inscription et les tarifs). Chaque programme renvoie vers /pre-inscription.
export const DEPARTEMENTS = [
  {
    id: 'genie-info',
    nom: 'Département Génie-Informatique',
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
    licences: ['Bachelor en Data Science & Big Data'],
    masters: [],
    ingenieur: 'Cycle Ingénieur en Intelligence Artificielle',
  },
  {
    id: 'gestion',
    nom: 'Département Gestion',
    licences: ['Finance & Comptabilité', 'Commerce International', 'Banque Finance'],
    masters: [],
    ingenieur: null,
  },
]
