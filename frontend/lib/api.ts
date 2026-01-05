import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar el token JWT a cada request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export interface Task {
  id: string
  user_id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  priority: number
  scheduled_for?: string
  scheduled_time?: string
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  status?: 'pending' | 'in_progress' | 'done'
  priority?: number
  scheduled_for?: string
  scheduled_time?: string
}

export interface TaskUpdate {
  title?: string
  status?: 'pending' | 'in_progress' | 'done'
  priority?: number
  scheduled_for?: string
  scheduled_time?: string
}

export interface User {
  id: string
  email: string
}

// Auth API
export const authApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}

// Tasks API
export const tasksApi = {
  getAll: async (status?: string, date?: string): Promise<Task[]> => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (date) params.append('task_date', date)
    const response = await apiClient.get(`/tasks?${params.toString()}`)
    return response.data
  },

  getToday: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/today')
    return response.data
  },

  getCurrent: async (): Promise<Task | { message: string }> => {
    const response = await apiClient.get('/tasks/current')
    return response.data
  },

  getById: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data
  },

  create: async (task: TaskCreate): Promise<Task> => {
    const response = await apiClient.post('/tasks', task)
    return response.data
  },

  update: async (id: string, task: TaskUpdate): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}`, task)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },
}

