import axios from 'axios'

const API = axios.create({ baseURL: '/api/sales' })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const getSales = (params) => API.get('/', { ...getAuthHeader(), params })
export const createSale = (data) => API.post('/', data, getAuthHeader())
export const updateSale = (id, data) => API.put(`/${id}`, data, getAuthHeader())
export const deleteSale = (id) => API.delete(`/${id}`, getAuthHeader())
export const markSalePaid = (id, paymentDate, paidAmount) => API.patch(`/${id}/paid`, { paymentDate, paidAmount }, getAuthHeader())
export const finalizeBill = (id) => API.patch(`/${id}/finalize`, {}, getAuthHeader())
export const getBillVersions = (id) => API.get(`/${id}/versions`, getAuthHeader())