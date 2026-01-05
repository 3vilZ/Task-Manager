'use client'

import { Task } from '@/lib/api'
import { useState } from 'react'

interface TaskItemProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
  onEdit?: (task: Task) => void
}

export default function TaskItem({ task, onUpdate, onDelete, onEdit }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⏳',
      label: 'Pending',
    },
    in_progress: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '🔄',
      label: 'In Progress',
    },
    done: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '✅',
      label: 'Done',
    },
  }

  const priorityConfig = {
    1: { color: 'text-red-600', label: 'Urgent', icon: '🔴' },
    2: { color: 'text-orange-600', label: 'High', icon: '🟠' },
    3: { color: 'text-yellow-600', label: 'Medium', icon: '🟡' },
    4: { color: 'text-blue-600', label: 'Low', icon: '🔵' },
    5: { color: 'text-gray-600', label: 'Very Low', icon: '⚪' },
  }

  const priority = Math.min(task.priority, 5) as keyof typeof priorityConfig
  const status = statusConfig[task.status]

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'done') => {
    onUpdate({ ...task, status: newStatus })
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true)
      try {
        await onDelete(task.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div
      className={`group rounded-xl border-2 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        task.status === 'done' ? 'opacity-75' : ''
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() => {
                  const newStatus = task.status === 'done' ? 'pending' : 'done'
                  handleStatusChange(newStatus)
                }}
                className="h-5 w-5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <h3
                className={`text-lg font-semibold ${
                  task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
              >
                {task.title}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${status.color}`}
                >
                  <span>{status.icon}</span>
                  {status.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${priorityConfig[priority].color}`}
                >
                  <span>{priorityConfig[priority].icon}</span>
                  {priorityConfig[priority].label}
                </span>
                {task.scheduled_for && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    📅 {new Date(task.scheduled_for).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {task.scheduled_time && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
                    🕐 {task.scheduled_time.substring(0, 5)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
              title="Edit task"
            >
              ✏️
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => {
                const nextStatus = task.status === 'pending' ? 'in_progress' : 'done'
                handleStatusChange(nextStatus)
              }}
              className="rounded-lg bg-indigo-100 p-2 text-indigo-600 transition-colors hover:bg-indigo-200"
              title={task.status === 'pending' ? 'Start task' : 'Complete task'}
            >
              {task.status === 'pending' ? '▶️' : '✓'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
            title="Delete task"
            disabled={isDeleting}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
