import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const API = axios.create({ baseURL: `${BASE}/api/transport` })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getTransports = () => API.get('/', getAuthHeader())
export const createTransport = (data) => API.post('/', data, getAuthHeader())
export const updateTransport = (id, data) => API.put(`/${id}`, data, getAuthHeader())
export const deleteTransport = (id) => API.delete(`/${id}`, getAuthHeader())
export const cycleStatus = (id) => API.patch(`/${id}/cycle-status`, {}, getAuthHeader())
export const getVehicles = () => API.get('/vehicles', getAuthHeader())
export const createVehicle = (data) => API.post('/vehicles', data, getAuthHeader())
export const updateVehicle = (id, data) => API.put(`/vehicles/${id}`, data, getAuthHeader())
export const deleteVehicle = (id) => API.delete(`/vehicles/${id}`, getAuthHeader())
export const getDrivers = () => API.get('/drivers', getAuthHeader())
export const createDriver = (data) => API.post('/drivers', data, getAuthHeader())
export const updateDriver = (id, data) => API.put(`/drivers/${id}`, data, getAuthHeader())
export const deleteDriver = (id) => API.delete(`/drivers/${id}`, getAuthHeader())
export const getRecentBills = () => API.get('/recent-bills', getAuthHeader())