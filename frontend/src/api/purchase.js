import axios from 'axios'

const API = axios.create({ baseURL: '/api/purchase' })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Purchase Material
export const getPurchases = () => API.get('/materials', getAuthHeader())
export const createPurchase = (data) => API.post('/materials', data, getAuthHeader())
export const updatePurchase = (id, data) => API.put(`/materials/${id}`, data, getAuthHeader())
export const deletePurchase = (id) => API.delete(`/materials/${id}`, getAuthHeader())
export const markPurchasePaid = (id, paymentDate, paidAmount) => API.patch(`/materials/${id}/paid`, { paymentDate, paidAmount }, getAuthHeader())
// Milk
export const getMilk = () => API.get('/milk', getAuthHeader())
export const createMilk = (data) => API.post('/milk', data, getAuthHeader())
export const updateMilk = (id, data) => API.put(`/milk/${id}`, data, getAuthHeader())
export const deleteMilk = (id) => API.delete(`/milk/${id}`, getAuthHeader())
export const markMilkPaid = (id, paymentDate, paidAmount) => API.patch(`/milk/${id}/paid`, { paymentDate, paidAmount }, getAuthHeader())

// Khawa
export const getKhawa = () => API.get('/khawa', getAuthHeader())
export const createKhawa = (data) => API.post('/khawa', data, getAuthHeader())
export const updateKhawa = (id, data) => API.put(`/khawa/${id}`, data, getAuthHeader())
export const deleteKhawa = (id) => API.delete(`/khawa/${id}`, getAuthHeader())
export const markKhawaPaid = (id, paymentDate, paidAmount) => API.patch(`/khawa/${id}/paid`, { paymentDate, paidAmount }, getAuthHeader())
