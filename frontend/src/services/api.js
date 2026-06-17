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
    return Promise.reject(error)
  }
)

// Auth
export const login = (data) => api.post('/login', data)
export const logout = () => api.post('/logout')
export const getMe = () => api.get('/me')

// Pre-inscription
export const submitPreInscription = (data) => api.post('/inscription', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// Public
export const getFilieres = () => api.get('/filieres')
export const getPublicStudents = () => api.get('/etudiants/publics')
export const verifyQR = (qr_data) => api.post('/qr/verify', { qr_data })

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

// Admin
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminStudents = (params) => api.get('/admin/etudiants', { params })
export const createAdminStudent = (data) => api.post('/admin/etudiants', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const acceptStudent = (id, data) => api.post(`/admin/etudiants/${id}/accepter`, data)
export const rejectStudent = (id, data) => api.post(`/admin/etudiants/${id}/rejeter`, data)
export const generateStudentCard = (id) => api.post(`/admin/etudiants/${id}/carte`)
export const getAdminPayments = (params) => api.get('/admin/paiements', { params })
export const createFiliere = (data) => api.post('/admin/filieres', data)
export const createLicense = (data) => api.post('/admin/licenses', data)
export const getStaff = () => api.get('/admin/staff')
export const createStaff = (data) => api.post('/admin/staff', data)

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

// Cashier
export const getCashierPayments = (params) => api.get('/caisse/paiements', { params })
export const recordManualPayment = (data) => api.post('/caisse/paiement', data)
export const getCashierStats = () => api.get('/caisse/stats')
export const downloadReceipt = (id) => `/api/caisse/paiement/${id}/recu`

export default api
