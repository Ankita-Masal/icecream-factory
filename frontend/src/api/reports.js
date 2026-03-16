import axios from 'axios'

const API = axios.create({ baseURL: '/api/reports' })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getSalesReport = (params) => API.get('/sales', { ...getAuthHeader(), params })
export const getInventoryReport = () => API.get('/inventory', getAuthHeader())
export const getGodownReport = () => API.get('/godown', getAuthHeader())
export const getPurchaseReport = (params) => API.get('/purchase', { ...getAuthHeader(), params })