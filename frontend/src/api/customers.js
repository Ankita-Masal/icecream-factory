import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const API = axios.create({ baseURL: `${BASE}/api/customers` })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getCustomers = () => API.get('/', getAuthHeader())
export const createCustomer = (data) => API.post('/', data, getAuthHeader())
export const updateCustomer = (id, data) => API.put(`/${id}`, data, getAuthHeader())
export const deleteCustomer = (id) => API.delete(`/${id}`, getAuthHeader())
export const getCustomerHistory = (id) => API.get(`/${id}/history`, getAuthHeader())