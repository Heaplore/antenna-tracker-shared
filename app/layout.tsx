import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'

export const metadata: Metadata = {
  title: '天线行业情报追踪系统',
  description: '天线行业情报追踪 - 市场研究、行业动态、企业追踪、价格监测、标准更新',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="navbar">
          <div className="navbar-container">
            <Link href="/" className="navbar-brand">📡 天线情报</Link>
            <div className="navbar-nav">
              <Link href="/" className="nav-link">首页</Link>
              <Link href="/market" className="nav-link">市场</Link>
              <Link href="/news" className="nav-link">行业动态</Link>
              <Link href="/companies" className="nav-link">企业</Link>
              <Link href="/prices" className="nav-link">价格</Link>
              <Link href="/standards" className="nav-link">标准</Link>
              <Link href="/technology" className="nav-link">技术</Link>
            </div>
            <div className="navbar-search">
              <button
                className="search-trigger"
                onClick={() => {
                  // 触发 GlobalSearch 组件显示
                  const event = new KeyboardEvent('keydown', { key: '/' })
                  document.dispatchEvent(event)
                }}
                title="搜索 (按 / 唤起)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="search-trigger-text">搜索</span>
                <kbd className="search-kbd">/</kbd>
              </button>
            </div>
          </div>
        </nav>
        <GlobalSearch />
        <main className="container">
          {children}
        </main>
        <footer className="footer">
          <p>天线行业情报追踪系统 · 数据持续更新中</p>
        </footer>
      </body>
    </html>
  )
}