'use client'

interface DashboardCardProps {
  title: string
  children: React.ReactNode
}

export default function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

