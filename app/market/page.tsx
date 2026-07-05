'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import marketDataRaw from '@/app/_data/market.json'

type MarketData = typeof marketDataRaw & { weekly_banner?: { period_label: string; generated_at: string; highlight: string; top_segment?: string; top_segment_cagr?: string } }
const marketData = marketDataRaw as MarketData

// Chart color palette (Recharts defaults)
const SEGMENT_COLORS = ['#0088FE', '#00C49F', '#9966FF', '#FFBB28', '#FF6699', '#FF8042', '#8884D8']

// Parse numeric value from strings like "320.53亿元"
function parseSize(val: string | undefined): number {
  if (!val) return 0
  const num = parseFloat(val.replace(/[^\d.]/g, ''))
  return isNaN(num) ? 0 : num
}

// Parse CAGR percentage
function parseCAGR(val: string | undefined): number {
  if (!val) return 0
  const num = parseFloat(val.replace('%', ''))
  return isNaN(num) ? 0 : num
}

// Sort segments by global size descending
const sortedSegments = [...marketData.segments].sort((a, b) => parseSize(b.globalSize) - parseSize(a.globalSize))
const chartData = sortedSegments.map((seg, i) => ({
  name: seg.name,
  value: parseSize(seg.globalSize),
  color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  cagr: seg.cagr,
  chinaSize: seg.chinaSize,
  forecastGlobal: seg.forecastGlobal,
  forecastYear: seg.forecastYear,
  drivers: seg.drivers,
  types: seg.types,
  keyPlayers: seg.keyPlayers,
  status: seg.status,
}))

// Trend data with prediction zone
const trendChartData = marketData.trendData.map(d => ({
  year: d.year,
  global: d.global,
  china: d.china,
  isPrediction: parseInt(d.year) >= 2025,
}))

export default function MarketPage() {
  const totalGlobal = chartData.reduce((sum, s) => sum + s.value, 0)
  const totalChina = sortedSegments.reduce((sum, s) => sum + parseSize(s.chinaSize), 0)
  const avgCAGR = (marketData.segments.reduce((sum, s) => sum + parseCAGR(s.cagr), 0) / marketData.segments.length).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="market-header">
        <div className="header-content">
          <h1>📊 市场分析</h1>
          <p>全球与中国天线市场规模、细分赛道、增长驱动因素</p>
          <p className="update-info">数据更新：{marketData.lastUpdate}</p>
        </div>
      </header>

      {/* 周报 banner */}
      {marketData.weekly_banner && (
        <section className="card weekly-banner">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-lg font-semibold">📅 本周市场周报（{marketData.weekly_banner.period_label}）</h2>
            <span className="text-xs text-gray-500">生成时间：{marketData.weekly_banner.generated_at}</span>
          </div>
          <p className="text-base leading-relaxed text-gray-700">{marketData.weekly_banner.highlight}</p>
          {marketData.weekly_banner.top_segment && (
            <p className="mt-2 text-sm text-gray-600">
              领跑细分：<strong>{marketData.weekly_banner.top_segment}</strong>
              {marketData.weekly_banner.top_segment_cagr && <span>（CAGR {marketData.weekly_banner.top_segment_cagr}）</span>}
            </p>
          )}
        </section>
      )}

      {/* Section 1: 宏观概览 — 环形图 + 关键数字 */}
      <section className="card">
        <h2 className="card-title">🌐 宏观概览</h2>
        <div className="overview-grid">
          {/* Donut chart */}
          <div className="chart-panel">
            <h3 className="panel-title">2024 全球细分市场占比</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(1)} 亿元`,
                      props.payload.name,
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key metrics */}
          <div className="metrics-panel">
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.globalMarketSize2024}</div>
              <div className="metric-label">2024 全球天线市场规模</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.chinaMarketSize2024}</div>
              <div className="metric-label">2024 中国市场规模</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.forecast2030}</div>
              <div className="metric-label">2030 年全球预测规模</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.cagr}</div>
              <div className="metric-label">年均复合增长率</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{sortedSegments.length}</div>
              <div className="metric-label">追踪细分赛道</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 市场规模趋势 — 折线图 + 预测区间 */}
      <section className="card">
        <h2 className="card-title">📈 市场规模趋势（2020-2030）</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="globalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="chinaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e53935" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#e53935" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="predictionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#667eea" stopOpacity={0.05}/>
                  <stop offset="100%" stopColor="#667eea" stopOpacity={0.15}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={(v) => `${v}亿`} width={55} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} 亿元`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              {/* Prediction zone shading */}
              <Area
                type="monotone"
                dataKey="global"
                stroke="#667eea"
                strokeWidth={2}
                fill="url(#globalGrad)"
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="china"
                stroke="#e53935"
                strokeWidth={2}
                fill="url(#chinaGrad)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend-custom">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#667eea' }}></span>全球市场规模</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#e53935' }}></span>中国市场规模</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: 'rgba(102,126,234,0.15)' }}></span>预测区间（2025-2030）</span>
          </div>
        </div>
      </section>

      {/* Section 3: 细分赛道对比 — 横向柱状图 */}
      <section className="card">
        <h2 className="card-title">📊 细分赛道规模对比</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 50)}>
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 'dataMax + 20']}
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(v) => `${v}亿`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#333' }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} 亿元`, '全球规模']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              <Bar
                dataKey="value"
                name="全球规模"
                fill="#0088FE"
                radius={[0, 6, 6, 0]}
                minPointSize={3}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 4: 增长驱动力 */}
      <section className="card">
        <h2 className="card-title">🚀 核心增长驱动力</h2>
        <div className="drivers-grid">
          {marketData.keyDrivers.map((driver, i) => (
            <div key={i} className="driver-chip">
              <span className="driver-icon">{['📡', '🏭', '🚗', '🛰️', '🛡️'][i % 5]}</span>
              <span>{driver}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: 细分赛道详情 */}
      <section className="card">
        <h2 className="card-title">🔍 细分赛道详情</h2>
        <div className="detail-grid">
          {chartData.map((seg, i) => (
            <div key={i} className="detail-card" style={{ borderTop: `3px solid ${seg.color}` }}>
              <div className="detail-header">
                <span className="detail-name">{seg.name}</span>
                <span className="detail-cagr" style={{ color: seg.color }}>{seg.cagr}</span>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-label">全球</span>
                  <span className="detail-stat-value">{seg.value.toFixed(1)} 亿元</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-label">中国</span>
                  <span className="detail-stat-value">{seg.chinaSize}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-label">20{seg.forecastYear?.toString().slice(-2)}</span>
                  <span className="detail-stat-value">{seg.forecastGlobal}</span>
                </div>
              </div>
              {seg.drivers && seg.drivers.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-label">驱动因素</span>
                  <div className="detail-tags">
                    {seg.drivers.map((d, j) => (
                      <span key={j} className="detail-tag">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.types && seg.types.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-label">主要类型</span>
                  <div className="detail-tags">
                    {seg.types.map((t, j) => (
                      <span key={j} className="detail-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.keyPlayers && seg.keyPlayers.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-label">主要玩家</span>
                  <div className="detail-players">
                    {seg.keyPlayers.map((p, j) => (
                      <span key={j} className="player-tag">{p.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.status && (
                <div className="detail-status">{seg.status}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
