'use client'

import { useState } from 'react'
import { TaskCreate, TaskUpdate } from '@/lib/api'

interface TaskFormProps {
  initialData?: TaskCreate | TaskUpdate
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export default function TaskForm({ initialData, onSubmit, onCancel, isEdit = false }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskCreate | TaskUpdate>({
    title: initialData?.title || '',
    status: initialData?.status || 'pending',
    priority: initialData?.priority || 5,
    scheduled_for: initialData?.scheduled_for || '',
    scheduled_time: initialData?.scheduled_time || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Limpiar campos vacíos antes de enviar
      const cleanData: TaskCreate | TaskUpdate = { ...formData }
      if (!cleanData.scheduled_for) delete cleanData.scheduled_for
      if (!cleanData.scheduled_time) delete cleanData.scheduled_time
      await onSubmit(cleanData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Task Title
        </label>
        <input
          type="text"
          id="title"
          required
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Enter task title..."
          value={formData.title as string}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.status as string}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="pending">⏳ Pending</option>
            <option value="in_progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
            Priority (1-10, lower = higher priority)
          </label>
          <input
            type="number"
            id="priority"
            min="1"
            max="10"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.priority as number}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label htmlFor="scheduled_for" className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Scheduled Date (optional)
          </label>
          <input
            type="date"
            id="scheduled_for"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.scheduled_for as string}
            onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="scheduled_time" className="block text-sm font-semibold text-gray-700 mb-2">
            🕐 Scheduled Time (optional)
          </label>
          <input
            type="time"
            id="scheduled_time"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.scheduled_time as string}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Saving...' : isEdit ? '💾 Update Task' : '✨ Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

