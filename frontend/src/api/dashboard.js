import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getDashboardData = () => API.get('/dashboard', getAuthHeader())