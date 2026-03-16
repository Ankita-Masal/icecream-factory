import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const API = axios.create({ baseURL: `${BASE}/api/godown` })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getMaterials = (search) => API.get('/', { ...getAuthHeader(), params: { search } })
export const getMaterialNames = () => API.get('/names', getAuthHeader())
export const addMaterial = (data) => API.post('/', data, getAuthHeader())
export const updateMaterial = (id, data) => API.put(`/${id}`, data, getAuthHeader())
export const deleteMaterial = (id) => API.delete(`/${id}`, getAuthHeader())
export const addUsage = (id, quantity) => API.post(`/${id}/usage`, { quantity }, getAuthHeader())
export const getUsageHistory = (id) => API.get(`/${id}/history`, getAuthHeader())