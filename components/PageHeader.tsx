'use client'

interface PageHeaderProps {
  title: string
  subtitle?: string
  updateInfo?: string
}

export default function PageHeader({ title, subtitle, updateInfo }: PageHeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {updateInfo && <p className="update-info">{updateInfo}</p>}
    </header>
  )
}
