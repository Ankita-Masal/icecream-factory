import axios from 'axios'

const API = axios.create({ baseURL: '/api/inventory' })

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Categories
export const getCategories = () => API.get('/categories', getAuthHeader())
export const createCategory = (name) => API.post('/categories', { name }, getAuthHeader())

// Products
export const getProducts = (params) => API.get('/products', { ...getAuthHeader(), params })
export const createProduct = (data) => API.post('/products', data, getAuthHeader())
export const updateProduct = (id, data) => API.put(`/products/${id}`, data, getAuthHeader())
export const deleteProduct = (id) => API.delete(`/products/${id}`, getAuthHeader())

// Boxes
export const getBoxes = () => API.get('/boxes', getAuthHeader())
export const createBox = (data) => API.post('/boxes', data, getAuthHeader())
export const updateBox = (id, data) => API.put(`/boxes/${id}`, data, getAuthHeader())
export const deleteBox = (id) => API.delete(`/boxes/${id}`, getAuthHeader())