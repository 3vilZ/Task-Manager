'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { tasksApi, Task } from '@/lib/api'
import DashboardCard from '@/components/DashboardCard'
import TaskList from '@/components/TaskList'
import StatsCard from '@/components/StatsCard'
import ProgressBar from '@/components/ProgressBar'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [today, current, all] = await Promise.all([
        tasksApi.getToday(),
        tasksApi.getCurrent(),
        tasksApi.getAll(),
      ])
      setTodayTasks(today)
      setAllTasks(all)
      if ('id' in current) {
        setCurrentTask(current)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas
  const stats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === 'done').length,
    inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
    pending: allTasks.filter((t) => t.status === 'pending').length,
    today: todayTasks.length,
    todayCompleted: todayTasks.filter((t) => t.status === 'done').length,
  }

  const handleTaskUpdate = async (task: Task) => {
    try {
      await tasksApi.update(task.id, {
        status: task.status,
      })
      loadDashboardData()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskDelete = async (id: string) => {
    try {
      await tasksApi.delete(id)
      loadDashboardData()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your tasks...</p>
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
            <div className="flex items-center gap-6">
              <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                Task Manager
              </h1>
              <Link
                href="/tasks"
                className="text-gray-600 transition-colors hover:text-indigo-600"
              >
                All Tasks
              </Link>
              <Link
                href="/schedule"
                className="text-gray-600 transition-colors hover:text-indigo-600"
              >
                Schedule
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Welcome back! Here's your overview for today.</p>
        </div>

        {/* Estadísticas */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon="📋"
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon="✅"
            color="green"
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon="🔄"
            color="purple"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon="⏳"
            color="yellow"
          />
        </div>

        <div className="space-y-6">
          {/* Tarea actual */}
          {currentTask && (
            <DashboardCard title="🎯 Focus Now">
              <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm opacity-90">Current Priority Task</p>
                    <h3 className="mt-2 text-2xl font-bold">{currentTask.title}</h3>
                    <div className="mt-4 flex items-center gap-4">
                      {currentTask.scheduled_time && (
                        <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm">
                          🕐 {currentTask.scheduled_time.substring(0, 5)}
                        </span>
                      )}
                      <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm">
                        Priority: {currentTask.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTaskUpdate({ ...currentTask, status: 'in_progress' })}
                    className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
                  >
                    Start
                  </button>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Progreso del día */}
          {stats.today > 0 && (
            <DashboardCard title="📊 Today's Progress">
              <ProgressBar
                completed={stats.todayCompleted}
                total={stats.today}
                label="Tasks completed today"
              />
            </DashboardCard>
          )}

          {/* Tareas de hoy */}
          <DashboardCard title="📅 Today's Tasks">
            {todayTasks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-6xl mb-4">🎉</p>
                <p className="text-lg font-medium text-gray-900">No tasks scheduled for today</p>
                <p className="mt-2 text-gray-500">Enjoy your free day or add some tasks!</p>
                <Link
                  href="/tasks"
                  className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-white transition-colors hover:bg-indigo-700"
                >
                  Add Task
                </Link>
              </div>
            ) : (
              <TaskList
                tasks={todayTasks}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
              />
            )}
          </DashboardCard>
        </div>
      </main>
    </div>
  )
}

