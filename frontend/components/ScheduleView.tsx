'use client'

import { Task } from '@/lib/api'

interface ScheduleViewProps {
  tasks: Task[]
}

export default function ScheduleView({ tasks }: ScheduleViewProps) {
  // Filtrar tareas con hora asignada y ordenarlas
  const scheduledTasks = tasks
    .filter((task) => task.scheduled_time)
    .sort((a, b) => {
      if (!a.scheduled_time || !b.scheduled_time) return 0
      return a.scheduled_time.localeCompare(b.scheduled_time)
    })

  if (scheduledTasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No scheduled tasks for today</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {scheduledTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex-shrink-0 text-lg font-semibold text-indigo-600">
            {task.scheduled_time}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-500">
              Priority: {task.priority} • Status: {task.status.replace('_', ' ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

