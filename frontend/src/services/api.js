import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('isi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('isi_token')
      localStorage.removeItem('isi_user')
      window.location.href = '/connexion'
    }
    if (error.response?.status === 503 && error.response?.data?.maintenance) {
      window.dispatchEvent(new CustomEvent('isi:maintenance', { detail: error.response.data }))
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (data) => api.post('/login', data)
export const logout = () => api.post('/logout')
export const getMe = () => api.get('/me')
export const updateMyPhoto = (formData) => api.post('/me/photo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateMyPassword = (data) => api.put('/me/password', data)
export const forgotPassword = (email) => api.post('/forgot-password', { email })
export const resetPassword = (data) => api.post('/reset-password', data)
export const verifyTwoFactor = (challenge, code) => api.post('/verify-2fa', { challenge, code })
export const resendTwoFactor = (challenge) => api.post('/resend-2fa', { challenge })

// Pre-inscription
export const submitPreInscription = (data) => api.post('/inscription', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// Dossier à compléter — étudiant renvoie ses pièces manquantes
export const submitMissingDocuments = (data) => api.post('/etudiant/documents/completer', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
// Admin/pédagogique upload un document au nom de l'étudiant
export const uploadStudentDocument = (studentId, data) => api.post(`/admin/etudiants/${studentId}/document`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// Public
export const getFilieres = () => api.get('/filieres')
export const getPublicStudents = () => api.get('/etudiants/publics')
export const verifyQR = (qr_data) => api.post('/qr/verify', { qr_data })
export const verifyMatricule = (matricule) => api.post('/qr/verify', { matricule })

// Public content
export const getFormateurs = () => api.get('/contenu/formateurs')
export const getMembresAdmins = () => api.get('/contenu/membres-admins')
export const getPartenaires = () => api.get('/contenu/partenaires')
export const getTemoignages = () => api.get('/contenu/temoignages')
export const submitTemoignage = (data) => api.post('/contenu/temoignages', data)
export const subscribeNewsletter = (data) => api.post('/newsletter/subscribe', data)

// Student
export const getStudentDashboard = () => api.get('/etudiant/dashboard')
export const getStudentPayments = () => api.get('/etudiant/paiements')
export const initiatePayment = (data) => api.post('/etudiant/paiement/initier', data)
export const markNotificationsRead = () => api.post('/etudiant/notifications/lire')
export const getStudentProfile = () => api.get('/etudiant/profil')
export const updateStudentProfile = (data) => api.put('/etudiant/profil', data)
export const getSuiviPaiements = () => api.get('/etudiant/suivi-paiements')
export const downloadStudentCard = () => api.get('/etudiant/carte/telecharger', { responseType: 'blob' })
export const updateStudentPhoto = (data) => api.post('/etudiant/profil/photo', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// Admin
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminStudents = (params) => api.get('/admin/etudiants', { params })
export const createAdminStudent = (data) => api.post('/admin/etudiants', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
// PUT + multipart/form-data n'est jamais parse par PHP (seul POST recoit un body
// multipart parse en $_POST/$_FILES) — Laravel verrait alors une requete sans aucun
// champ et $student->update() serait un no-op silencieux. On envoie donc un vrai POST
// avec un champ _method=PUT (method-spoofing standard de Laravel) pour que le body
// multipart soit bien parse tout en routant vers le controleur PUT.
export const updatePedagogiqueStudent = (id, data) => {
  data.append('_method', 'PUT')
  return api.post(`/pedagogique/etudiants/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const updateAdminStudent = (id, data) => {
  data.append('_method', 'PUT')
  return api.post(`/admin/etudiants/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const acceptStudent = (id, data) => api.post(`/admin/etudiants/${id}/accepter`, data)
export const rejectStudent = (id, data) => api.post(`/admin/etudiants/${id}/rejeter`, data)
export const deleteStudent = (id) => api.delete(`/admin/etudiants/${id}`)
export const getTrashedStudents = () => api.get('/admin/etudiants/corbeille')
export const restoreStudent = (id) => api.post(`/admin/etudiants/${id}/restaurer`)
export const forceDeleteStudent = (id) => api.delete(`/admin/etudiants/${id}/forcer`)
export const generateStudentCard = (id) => api.post(`/admin/etudiants/${id}/carte`)
export const downloadAdminCard   = (id) => api.get(`/pedagogique/etudiants/${id}/carte/telecharger`, { responseType: 'blob' })
export const downloadAttestationScolarite   = (id) => api.get(`/pedagogique/etudiants/${id}/attestation-scolarite`, { responseType: 'blob' })
export const downloadAttestationInscription = (id) => api.get(`/pedagogique/etudiants/${id}/attestation-inscription`, { responseType: 'blob' })
export const downloadFicheInscription       = (id) => api.get(`/pedagogique/etudiants/${id}/fiche-inscription`, { responseType: 'blob' })
export const downloadCertificatScolarite      = (id) => api.get(`/pedagogique/etudiants/${id}/certificat-scolarite`, { responseType: 'blob' })
export const downloadAttestationFormation     = (id) => api.get(`/pedagogique/etudiants/${id}/attestation-formation`, { responseType: 'blob' })
export const downloadAttestationNonSoutenance = (id) => api.get(`/pedagogique/etudiants/${id}/attestation-non-soutenance`, { responseType: 'blob' })
export const downloadAttestationReussite      = (id, data) => api.post(`/pedagogique/etudiants/${id}/attestation-reussite`, data, { responseType: 'blob' })
export const downloadAttestationEncouragement = (id, data) => api.post(`/pedagogique/etudiants/${id}/attestation-encouragement`, data, { responseType: 'blob' })
export const downloadDiplomeLicence           = (id, data) => api.post(`/pedagogique/etudiants/${id}/diplome-licence`, data, { responseType: 'blob' })
export const getAdminPayments = (params) => api.get('/admin/paiements', { params })
export const createFiliere = (data) => api.post('/admin/filieres', data)
export const updateAdminFiliere = (id, data) => api.put(`/admin/filieres/${id}`, data)
export const deleteAdminFiliere = (id) => api.delete(`/admin/filieres/${id}`)
export const createLicense = (data) => api.post('/admin/licenses', data)
export const updateAdminLicense = (id, data) => api.put(`/admin/licenses/${id}`, data)
export const deleteAdminLicense = (id) => api.delete(`/admin/licenses/${id}`)
// Pédagogique filières (accessible aussi par admin)
export const getPedagogiqueFileres = () => api.get('/pedagogique/filieres')
export const createPedagogiqueFiliere = (data) => api.post('/pedagogique/filieres', data)
export const updatePedagogiqueFiliere = (id, data) => api.put(`/pedagogique/filieres/${id}`, data)
export const deletePedagogiqueFiliere = (id) => api.delete(`/pedagogique/filieres/${id}`)
export const createPedagogiqueLicense = (data) => api.post('/pedagogique/licenses', data)
export const updatePedagogiqueLicense = (id, data) => api.put(`/pedagogique/licenses/${id}`, data)
export const deletePedagogiqueLicense = (id) => api.delete(`/pedagogique/licenses/${id}`)
export const getStaff = () => api.get('/admin/staff')
export const createStaff = (data) => api.post('/admin/staff', data)
export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`)
export const updateStaffRole = (id, role) => api.put(`/admin/staff/${id}/role`, { role })

// Admin content
export const adminGetFormateurs = () => api.get('/admin/contenu/formateurs')
export const adminCreateFormateur = (data) => api.post('/admin/contenu/formateurs', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminUpdateFormateur = (id, data) => api.post(`/admin/contenu/formateurs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminDeleteFormateur = (id) => api.delete(`/admin/contenu/formateurs/${id}`)

export const adminGetMembres = () => api.get('/admin/contenu/membres')
export const adminCreateMembre = (data) => api.post('/admin/contenu/membres', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminDeleteMembre = (id) => api.delete(`/admin/contenu/membres/${id}`)

export const adminGetPartenaires = () => api.get('/admin/contenu/partenaires')
export const adminCreatePartenaire = (data) => api.post('/admin/contenu/partenaires', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminDeletePartenaire = (id) => api.delete(`/admin/contenu/partenaires/${id}`)

export const adminGetTemoignages = () => api.get('/admin/contenu/temoignages')
export const adminApprouverTemoignage = (id) => api.post(`/admin/contenu/temoignages/${id}/approuver`)
export const adminDeleteTemoignage = (id) => api.delete(`/admin/contenu/temoignages/${id}`)

export const adminGetNewsletter = () => api.get('/admin/contenu/newsletter')
export const adminSendNewsletterAnnouncement = (data) => api.post('/admin/contenu/newsletter/annoncer', data)
export const getSiteStats = () => api.get('/settings/stats')
export const updateSiteStats = (data) => api.post('/admin/contenu/stats', data)
export const getContentBlocks = () => api.get('/contenu/blocs')
export const updateContentBlockText = (cle, valeur) => api.post('/admin/contenu/blocs/texte', { cle, valeur })
export const updateContentBlockImage = (cle, formData) => api.post('/admin/contenu/blocs/photo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// Cashier
export const getCashierPayments = (params) => api.get('/caisse/paiements', { params })
export const recordManualPayment = (data) => api.post('/caisse/paiement', data)
export const updateManualPayment = (id, data) => api.put(`/caisse/paiement/${id}`, data)
export const demanderModificationPaiement = (id, data) => api.post(`/caisse/paiement/${id}/demander-modification`, data)
export const getStatutDemandeModification = (id) => api.get(`/caisse/paiement/${id}/demande-modification`)
export const recordManualPaymentMultiMois = (data) => api.post('/caisse/paiement/multi-mois', data)
export const getCashierStats = () => api.get('/caisse/stats')
export const downloadReceiptBlob = (id) => api.get(`/caisse/paiement/${id}/recu`, { responseType: 'blob' })
export const getEtudiantsAttentePaiement = (params) => api.get('/caisse/etudiants-attente', { params })
export const getMoisDesactives = () => api.get('/caisse/mois-desactives')
export const getImpayesMois = (mois) => api.get('/caisse/impayes-mois', { params: { mois } })

// Admin — mois désactivés
export const adminGetMoisDesactives = () => api.get('/admin/mois-desactives')
export const adminToggleMoisDesactive = (data) => api.post('/admin/mois-desactives', data)
export const lockStudentProfile = (id) => api.post(`/admin/etudiants/${id}/verrouiller-profil`)

// Admin — permissions de modification de paiement
export const getPermissionsModification = (params) => api.get('/admin/permissions-modification', { params })
export const approuverPermission = (id) => api.post(`/admin/permissions-modification/${id}/approuver`)
export const refuserPermission = (id) => api.post(`/admin/permissions-modification/${id}/refuser`)

// Admin — journal d'audit
export const getAuditLog = (params) => api.get('/admin/audit', { params })

// Admin — mode maintenance
export const toggleMaintenance = (data) => api.post('/admin/maintenance', data)
export const getMaintenanceStatus = () => api.get('/maintenance-status')
export const forceTwoFactorForAll = () => api.post('/admin/force-2fa')
export const getForceTwoFactorStatus = () => api.get('/admin/force-2fa')

export const cancelStudentPayment = (id) => api.delete(`/etudiant/paiement/${id}`)

// Student — receipt (auth-protected, uses student route)
export const downloadStudentReceiptBlob = (id) => api.get(`/etudiant/paiement/${id}/recu`, { responseType: 'blob' })

// Cashier — impayés PDF
export const downloadImpayesPdfBlob = (mois) => api.get(`/caisse/impayes-mois/pdf`, { params: { mois }, responseType: 'blob' })
export const downloadBrouillardBlob = (date) => api.get(`/caisse/brouillard`, { params: { date }, responseType: 'blob' })
export const downloadFactureProformaBlob = (data) => api.post('/caisse/facture-proforma', data, { responseType: 'blob' })

// Cashier — student browser
export const getCashierStudents = (params) => api.get('/caisse/etudiants', { params })
export const getCashierStudentSuivi = (id) => api.get(`/caisse/etudiants/${id}/suivi`)
export const getInscriptionDetails = (id) => api.get(`/caisse/etudiants/${id}/inscription-details`)

// Admin — settings
export const getAdminSettings = () => api.get('/admin/settings')
export const updateAdminSettings = (data) => api.put('/admin/settings', data)
// Pédagogique — settings (lecture)
export const getPedagogiqueSettings = () => api.get('/pedagogique/settings')
// Admin — reset test data
export const resetDonneesTest = () => api.post('/admin/reset-donnees-test', { confirmation: 'RESET_CONFIRMED' })
export const deleteAllAccounts = () => api.post('/admin/delete-all-accounts', { confirmation: 'DELETE_ALL_CONFIRMED' })

// Accueil — matricule verification
export const verifyMatriculeAccueil = (matricule) => api.get(`/accueil/verify-matricule/${encodeURIComponent(matricule)}`)

// Accueil Pédagogique
export const getPedagogiqueClasses        = ()       => api.get('/pedagogique/classes')
export const getPedagogiqueStudents       = (params) => api.get('/pedagogique/etudiants', { params })
export const addPedagogiqueStudent        = (data)   => api.post('/pedagogique/etudiants', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getPedagogiqueStudentDetail  = (id)     => api.get(`/pedagogique/etudiants/${id}`)
export const downloadClassListPdf         = (params) => api.get('/pedagogique/classes/liste-pdf', { params, responseType: 'blob' })
export const generatePedagogiqueCard      = (id)     => api.post(`/pedagogique/etudiants/${id}/carte`)
export const downloadPedagogiqueCard      = (id)     => api.get(`/pedagogique/etudiants/${id}/carte/telecharger`, { responseType: 'blob' })
export const togglePedagogiqueLock        = (id)     => api.post(`/pedagogique/etudiants/${id}/verrouiller`)
export const updatePedagogiquePhoto       = (id, data) => api.post(`/pedagogique/etudiants/${id}/photo`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const uploadPedagogiqueDocument    = (id, data) => api.post(`/pedagogique/etudiants/${id}/document`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getPedagogiquePending        = (params) => api.get('/pedagogique/candidats', { params })
export const acceptPedagogiqueStudent     = (id)     => api.post(`/pedagogique/candidats/${id}/accepter`)

// ── Curriculum académique (semestres / modules / matières / profs / notes) ──
export const getLicenseSemestres  = (licenseId) => api.get(`/curriculum/licenses/${licenseId}/semestres`)
export const createSemestre       = (licenseId, data) => api.post(`/curriculum/licenses/${licenseId}/semestres`, data)
export const createModule         = (semestreId, data) => api.post(`/curriculum/semestres/${semestreId}/modules`, data)
export const updateModule         = (moduleId, data) => api.put(`/curriculum/modules/${moduleId}`, data)
export const deleteModule         = (moduleId) => api.delete(`/curriculum/modules/${moduleId}`)
export const createMatiere        = (moduleId, data) => api.post(`/curriculum/modules/${moduleId}/matieres`, data)
export const createMatiereDirecte = (semestreId, data) => api.post(`/curriculum/semestres/${semestreId}/matieres-directes`, data)
export const updateMatiere        = (matiereId, data) => api.put(`/curriculum/matieres/${matiereId}`, data)
export const deleteMatiere        = (matiereId) => api.delete(`/curriculum/matieres/${matiereId}`)
export const getProfesseurs       = () => api.get('/curriculum/professeurs')
export const createProfesseur     = (data) => api.post('/curriculum/professeurs', data)
export const updateProfesseur     = (id, data) => api.put(`/curriculum/professeurs/${id}`, data)
export const deleteProfesseur     = (id) => api.delete(`/curriculum/professeurs/${id}`)
export const createCreneau        = (matiereId, data) => api.post(`/curriculum/matieres/${matiereId}/creneaux`, data)
export const deleteCreneau        = (id) => api.delete(`/curriculum/creneaux/${id}`)
export const getAdminPresences    = (matiereId, params) => api.get(`/curriculum/matieres/${matiereId}/presences`, { params })
export const saisirAdminPresences = (matiereId, data) => api.post(`/curriculum/matieres/${matiereId}/presences`, data)
export const getConseilClasse     = (semestreId, params) => api.get(`/curriculum/semestres/${semestreId}/conseil-classe`, { params })
export const downloadConseilClassePdf = (semestreId, params) => api.get(`/curriculum/semestres/${semestreId}/conseil-classe-pdf`, { params, responseType: 'blob' })
export const saisirNotesEtudiant  = (studentId, data) => api.post(`/curriculum/etudiants/${studentId}/notes`, data)
export const getBulletin          = (semestreId, studentId, params) => api.get(`/curriculum/semestres/${semestreId}/etudiants/${studentId}/bulletin`, { params })
export const downloadBulletinPdf  = (semestreId, studentId, data) => api.post(`/curriculum/semestres/${semestreId}/etudiants/${studentId}/bulletin-pdf`, data, { responseType: 'blob' })
export const getMonEmploiDuTemps  = () => api.get('/etudiant/emploi-du-temps')
export const createProfesseurAccount = (id, data) => api.post(`/curriculum/professeurs/${id}/compte`, data)
export const getVerrouStatus      = (semestreId, params) => api.get(`/curriculum/semestres/${semestreId}/verrou`, { params })
export const toggleVerrouNotes    = (semestreId, data) => api.post(`/curriculum/semestres/${semestreId}/verrou`, data)
export const downloadEmploiDuTempsPdf = (semestreId) => api.get(`/curriculum/semestres/${semestreId}/emploi-du-temps-pdf`, { responseType: 'blob' })
export const downloadBulletinsClasseZip = (semestreId, params) => api.get(`/curriculum/semestres/${semestreId}/bulletins-classe-zip`, { params, responseType: 'blob' })
export const getAdminContenus     = (matiereId) => api.get(`/curriculum/matieres/${matiereId}/contenus`)
export const getProfContenus      = (matiereId) => api.get(`/prof/matieres/${matiereId}/contenus`)
export const saisirProfContenu    = (matiereId, data) => api.post(`/prof/matieres/${matiereId}/contenus`, data)

// ── Étudiant — bulletins ─────────────────────────────────────────────────────
export const getMesBulletins        = () => api.get('/etudiant/bulletins')
export const downloadMonBulletinPdf = (semestreId) => api.get(`/etudiant/semestres/${semestreId}/bulletin-pdf`, { responseType: 'blob' })

// ── Espace professeur ────────────────────────────────────────────────────────
export const getProfEmploiDuTemps = () => api.get('/prof/emploi-du-temps')
export const getProfMatieres      = () => api.get('/prof/matieres')
export const getProfRoster        = (matiereId) => api.get(`/prof/matieres/${matiereId}/effectif`)
export const getProfPresences     = (matiereId, params) => api.get(`/prof/matieres/${matiereId}/presences`, { params })
export const saisirProfPresences  = (matiereId, data) => api.post(`/prof/matieres/${matiereId}/presences`, data)
export const getProfNotes         = (matiereId, params) => api.get(`/prof/matieres/${matiereId}/notes`, { params })
export const saisirProfNotes      = (matiereId, data) => api.post(`/prof/matieres/${matiereId}/notes`, data)

export default api
