import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const API = axios.create({ baseURL: `${BASE}/api/workers` })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getWorkers = (type) => API.get('/', { ...getAuthHeader(), params: { type } })
export const createWorker = (data) => API.post('/', data, getAuthHeader())
export const updateWorker = (id, data) => API.put(`/${id}`, data, getAuthHeader())
export const deleteWorker = (id) => API.delete(`/${id}`, getAuthHeader())
export const getAttendance = (id, year, month) => API.get(`/${id}/attendance`, { ...getAuthHeader(), params: { year, month } })
export const saveAttendance = (id, data) => API.post(`/${id}/attendance`, data, getAuthHeader())