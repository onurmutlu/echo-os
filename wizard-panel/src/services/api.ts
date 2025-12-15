import axios from 'axios'

const normalizeBaseURL = (base: string) => base.replace(/\/+$/, '')

// Base API
// - Default: same-origin (/api) so Vite proxy can handle it in dev (avoids CORS)
// - Override with VITE_API_BASE_URL when needed (e.g. direct remote)
const getBaseURL = () => {
  const envBase = import.meta.env?.VITE_API_BASE_URL as string | undefined
  return normalizeBaseURL(envBase || '/api')
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
})

// Episode API
export const episodeApi = {
  getAll: () => api.get('/episodes'),
  getById: (id: string) => api.get(`/episodes/${id}`),
  create: (data: any) => api.post('/episodes', data),
  update: (id: string, data: any) => api.put(`/episodes/${id}`, data),
  delete: (id: string) => api.delete(`/episodes/${id}`),
  render: (id: string, options: any) => api.post(`/episodes/${id}/render`, options),
}

// Universe API
export const universeApi = {
  getAll: () => api.get('/universes'),
  getById: (id: string) => api.get(`/universes/${id}`),
  create: (data: any) => api.post('/universes', data),
  update: (id: string, data: any) => api.put(`/universes/${id}`, data),
  delete: (id: string) => api.delete(`/universes/${id}`),
}

// Character API
export const characterApi = {
  getAll: () => api.get('/characters/'),
  getById: (id: string) => api.get(`/characters/${id}`),
  getPrompt: (id: string, outfit?: string, includeContext?: boolean) => 
    api.get(`/characters/${id}/prompt`, { params: { outfit, include_context: includeContext } }),
  create: (data: any) => api.post('/characters', data),
  update: (id: string, data: any) => api.put(`/characters/${id}`, data),
  delete: (id: string) => api.delete(`/characters/${id}`),
  generatePortrait: (id: string) => api.post(`/characters/${id}/generate-portrait`),
}

// Render Queue API
export const renderApi = {
  getQueue: (limit?: number, status?: string) => api.get('/render-queue/jobs', { params: { limit, status } }),
  addToQueue: (data: any) => api.post('/render-queue', data), // This endpoint might need implementation or update
  pauseQueue: () => api.post('/render-queue/pause'),
  resumeQueue: () => api.post('/render-queue/resume'),
  cancelRender: (id: string) => api.post(`/render-queue/jobs/${id}/cancel`),
  retryRender: (id: string) => api.post(`/render-queue/jobs/${id}/retry`),
}

// NFT API
export const nftApi = {
  getCollections: () => api.get('/nft/collections'),
  getCollection: (id: string) => api.get(`/nft/collections/${id}`),
  generateMetadata: (episodeId: string) => api.post(`/nft/generate-metadata/${episodeId}`),
  exportCollection: (id: string) => api.get(`/nft/collections/${id}/export`),
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
}

// Style API
export const styleApi = {
  getAll: () => api.get('/styles'),
  getById: (id: string) => api.get(`/styles/${id}`),
}

// SV Binding API
export const svBindingApi = {
  getStatus: (kind: string, id: string) => api.get(`/sv-binding/status?kind=${kind}&id=${id}`),
  getAlerts: () => api.get('/sv-binding/telemetry-alerts'),
  retry: (data: any) => api.post('/sv-binding/retry', data),
}

export default api
