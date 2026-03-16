import axios from 'axios'

const API = axios.create({
  baseURL: '/api'
})

export const login = async (username, password) => {
  const response = await API.post('/auth/login', { username, password })
  return response.data
}