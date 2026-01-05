'use client'

import { Task } from '@/lib/api'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
  onEdit?: (task: Task) => void
}

export default function TaskList({ tasks, onUpdate, onDelete, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <p className="text-6xl mb-4">📭</p>
        <p className="text-lg font-medium text-gray-900">No tasks found</p>
        <p className="mt-2 text-gray-500">Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <TaskItem
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  )
}

