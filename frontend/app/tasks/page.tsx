'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { tasksApi, Task, TaskCreate } from '@/lib/api'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import Link from 'next/link'

export default function TasksPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadTasks()
    }
  }, [user, authLoading, router, statusFilter, dateFilter])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getAll(statusFilter || undefined, dateFilter || undefined)
      setTasks(data)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (taskData: TaskCreate) => {
    try {
      await tasksApi.create(taskData)
      setShowForm(false)
      loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdate = async (taskData: TaskCreate | TaskUpdate) => {
    if (!editingTask) return
    try {
      await tasksApi.update(editingTask.id, taskData)
      setEditingTask(null)
      setShowForm(false)
      loadTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleEditClick = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.delete(id)
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Task Manager
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/schedule"
                className="text-gray-600 hover:text-gray-900"
              >
                Schedule
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="mt-1 text-gray-600">Manage all your tasks in one place</p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null)
              setShowForm(true)
            }}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            + New Task
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">🔄 In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {(statusFilter || dateFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('')
                  setDateFilter('')
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTask ? '✏️ Edit Task' : '✨ Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingTask(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <TaskForm
              initialData={editingTask ? {
                title: editingTask.title,
                status: editingTask.status,
                priority: editingTask.priority,
                scheduled_for: editingTask.scheduled_for,
                scheduled_time: editingTask.scheduled_time,
              } : undefined}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingTask(null)
              }}
              isEdit={!!editingTask}
            />
          </div>
        )}

        <TaskList
          tasks={tasks}
          onUpdate={async (task) => {
            await tasksApi.update(task.id, {
              status: task.status,
              title: task.title,
              priority: task.priority,
              scheduled_for: task.scheduled_for,
              scheduled_time: task.scheduled_time,
            })
            loadTasks()
          }}
          onDelete={handleDelete}
          onEdit={handleEditClick}
        />
      </main>
    </div>
  )
}

