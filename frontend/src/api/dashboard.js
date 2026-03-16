import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const API = axios.create({ baseURL: `${BASE}/api` })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getDashboardData = () => API.get('/dashboard', getAuthHeader())