'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import marketDataRaw from '@/app/_data/market.json'

type WorldMarketData = NonNullable<typeof marketDataRaw.worldMarketData>
type MarketData = typeof marketDataRaw & { weekly_banner?: { period_label: string; generated_at: string; highlight: string; top_segment?: string; top_segment_cagr?: string } }
const marketData = marketDataRaw as MarketData

// Chart color palette (Recharts defaults)
const SEGMENT_COLORS = ['#0088FE', '#00C49F', '#9966FF', '#FFBB28', '#FF6699', '#FF8042', '#8884D8']
const BRAND = '#0FB5A8'
const BRAND_DEEP = '#0A4D5C'
const BRAND_LIGHT = '#5EEAD4'
const BRAND_PALE = '#A7F3D0'
const AMBER = '#FFD166'
const ROSE = '#E76F51'

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

// === Derived chart data from worldMarketData ===
const worldData = marketData.worldMarketData

// Market scale timeline (RMB 亿元)
const timelineChartData = worldData ? Object.entries(worldData.marketScale).map(([k,v]) => ({ year: k, global: v, china: (v * 0.258).toFixed(1) })) : []

// Application mix pie data
const appMixData = worldData ? Object.entries(worldData.applicationMix2024).map(([name, value]) => ({ name, value })) : []
const APP_MIX_COLORS = [BRAND, BRAND_LIGHT, BRAND_PALE, AMBER, ROSE, '#F4A261', '#C8E6E0']

// Regional share bar
const regionData = worldData ? Object.entries(worldData.regionalShare2024).map(([name, value]) => ({ name, value })) : []

// Vendor share bar
const vendorData = worldData ? Object.entries(worldData.vendorMarketShare2024).map(([name, value]) => ({ name, value })) : []

// Hot segment lines — use bracket notation for numeric property access
const massiveMIMOLine = [{ year: '2024', value: worldData?.hotSegments.massiveMIMO?.['2024'] || 0 }, { year: '2031E', value: worldData?.hotSegments.massiveMIMO?.['2031E'] || 0 }]
const satelliteLine = [{ year: '2024', value: worldData?.hotSegments.satellitePhasedArray?.['2024'] || 0 }, { year: '2034E', value: worldData?.hotSegments.satellitePhasedArray?.['2034E'] || 0 }]
const v2xLine = worldData ? Object.entries({ '2023': worldData.hotSegments.v2x?.['2023'] }).concat(Object.entries({ '2030E': worldData.hotSegments.v2x?.['2030E'] })).map(([k,v]) => ({ year: k, value: v })) : []

// Tech maturity scatter
const techData = worldData ? worldData.techMaturity.map(t => ({ name: t.name, x: t.commercialization, y: t.aspElasticity })) : []

export default function MarketPage() {
  const totalGlobal = chartData.reduce((sum, s) => sum + s.value, 0)
  const totalChina = sortedSegments.reduce((sum, s) => sum + parseSize(s.chinaSize), 0)
  const avgCAGR = (marketData.segments.reduce((sum, s) => sum + parseCAGR(s.cagr), 0) / marketData.segments.length).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="market-header">
        <div className="header-content">
          <h1>市场与竞争格局分析</h1>
          <p>全球天线产业深度研究 · 基于12家机构交叉验证</p>
          <p className="update-info">数据更新：{marketData.lastUpdate}</p>
        </div>
      </header>

      {/* 周报 banner */}
      {marketData.weekly_banner && (
        <section className="card weekly-banner">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-lg font-semibold">本周市场周报（{marketData.weekly_banner.period_label}）</h2>
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

      {/* Section 1: 宏观概览 */}
      <section className="card">
        <h2 className="card-title">宏观概览</h2>
        <div className="overview-grid">
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
          <div className="metrics-panel">
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.globalMarketSize2024}</div>
              <div className="metric-label">2024 全球天线市场规模（机构中位）</div>
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
              <div className="metric-label">综合年复合增长率</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{sortedSegments.length}</div>
              <div className="metric-label">追踪细分赛道</div>
            </div>
            {marketData.summary.forecastDetail && (
              <div className="metric-item" style={{ fontSize: '0.75rem', color: '#666' }}>
                <div className="metric-value" style={{ fontSize: '0.75rem' }}>
                  {Object.entries(marketData.summary.forecastDetail).map(([k,v]) => `${k}: ${v}`).join(' / ')}
                </div>
                <div className="metric-label">多情景预测范围</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: 市场规模趋势 */}
      <section className="card">
        <h2 className="card-title">市场规模趋势（2019-2030 全球尺度）</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineChartData.map((d:any) => ({
              year: d.year,
              global: Number(d.global),
              china: Number(d.china),
              isPrediction: parseInt(String(d.year)) >= 2025,
            }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="globalGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="chinaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AMBER} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={(v) => `${v}亿`} width={55} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} 亿元`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              <Area type="monotone" dataKey="global" stroke={BRAND} strokeWidth={2} fill="url(#globalGrad2)" activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="china" stroke={AMBER} strokeWidth={2} fill="url(#chinaGrad2)" activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend-custom">
            <span className="legend-item"><span className="legend-dot" style={{ background: BRAND }}></span>全球市场规模（亿美元）</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: AMBER }}></span>中国市场估测</span>
          </div>
        </div>
      </section>

      {/* Section 3: 应用结构与区域分布 */}
      <section className="card">
        <h2 className="card-title">应用结构与区域分布</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* 应用结构 */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>2024 年应用场景价值占比</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={appMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={1}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {appMixData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={APP_MIX_COLORS[index % APP_MIX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 区域分布 */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>2024 年出货区域占比</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value: number) => [`${value}%`, '份额']} />
                <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section 4: 厂商竞争格局 */}
      <section className="card">
        <h2 className="card-title">厂商竞争格局（2024 市占率）</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value: number) => [`${value}%`, '市占率']} />
              <Bar
                dataKey="value"
                fill={BRAND}
                radius={[0, 6, 6, 0]}
                background={{ fill: '#f0f0f0' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderTop: `3px solid ${BRAND}` }}>
            <strong>第一梯队 · 全球巨头</strong>
            <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#666' }}>华为 30%、爱立信 18%、诺基亚 12% — RAN龙头，AAU/Massive MIMO产能双护城河</p>
          </div>
          <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderTop: `3px solid ${AMBER}` }}>
            <strong>第二梯队 · 中韩挑战者</strong>
            <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#666' }}>中兴 9%、三星 6%、京信通信 5% — 5G-Advanced大规模天线出货领先</p>
          </div>
          <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderTop: `3px solid ${BRAND_LIGHT}` }}>
            <strong>第三梯队 · 专精与新兴</strong>
            <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#666' }}>康普 4%、通宇通讯 3%、摩比发展 2% — 终端天线/车载天线/性价比突围</p>
          </div>
        </div>
      </section>

      {/* Section 5: 高增长细分赛道 */}
      <section className="card">
        <h2 className="card-title">高增长细分赛道（Massive MIMO / 卫星相控阵 / V2X）</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Massive MIMO */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: BRAND_DEEP, marginBottom: '6px' }}>Massive MIMO</h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={massiveMIMOLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#999' }} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} unit="亿" width={40} />
                <Tooltip formatter={(v: number) => [`$${v}亿`, '规模']} />
                <Area type="monotone" dataKey="value" stroke={BRAND} fill="rgba(15,181,168,0.14)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              CAGR <strong style={{ color: BRAND }}>{worldData?.hotSegments.massiveMIMO?.cagr}</strong> · 从{worldData?.hotSegments.massiveMIMO?.['2024']}亿增至{worldData?.hotSegments.massiveMIMO?.['2031E']}亿
            </div>
          </div>
          {/* Satellite Phased Array */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: BRAND_DEEP, marginBottom: '6px' }}>卫星相控阵天线</h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={satelliteLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#999' }} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} unit="亿" width={40} />
                <Tooltip formatter={(v: number) => [`$${v}亿`, '规模']} />
                <Area type="monotone" dataKey="value" stroke={BRAND_DEEP} fill="rgba(10,77,92,0.12)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              CAGR <strong style={{ color: BRAND }}>{worldData?.hotSegments.satellitePhasedArray?.cagr}</strong> · 从{worldData?.hotSegments.satellitePhasedArray?.['2024']}亿增至{worldData?.hotSegments.satellitePhasedArray?.['2034E']}亿
            </div>
          </div>
          {/* V2X */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: BRAND_DEEP, marginBottom: '6px' }}>汽车V2X天线</h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={v2xLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#999' }} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} unit="亿" width={40} />
                <Tooltip formatter={(v: number) => [`$${v}亿`, '规模']} />
                <Area type="monotone" dataKey="value" stroke={AMBER} fill="rgba(255,209,102,0.14)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              CAGR <strong style={{ color: AMBER }}>{worldData?.hotSegments.v2x?.cagr}</strong> · 早期但增速最高，2030年预计达{worldData?.hotSegments.v2x?.['2030E']}亿
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: 技术成熟度象限 */}
      <section className="card">
        <h2 className="card-title">技术成熟度象限（商业化进度 vs ASP弹性）</h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>Massive MIMO与卫星相控阵位于高商业价值象限，是产业最大利润池</p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" dataKey="x" name="商业化" domain={[20, 100]} tick={{ fontSize: 11, fill: '#999' }} label={{ value: '商业化进度 ->', position: 'insideBottom', offset: -10, fontSize: 12, fill: BRAND_DEEP }} />
            <YAxis type="number" dataKey="y" name="ASP弹性" domain={[20, 100]} tick={{ fontSize: 11, fill: '#999' }} label={{ value: 'ASP弹性 ->', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: BRAND_DEEP }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'x') return [`${props.payload.name}: ${value}`, '商业化'];
                if (name === 'y') return [`${value}`, 'ASP弹性'];
                return [value, name];
              }}
            />
            <Scatter data={techData} fill={BRAND} shape="circle">
              {techData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.x > 70 && entry.y > 60 ? BRAND_DEEP :
                  entry.x > 70 ? BRAND :
                  entry.x < 40 ? ROSE :
                  AMBER
                } />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      {/* Section 7: 增长驱动因素 */}
      <section className="card">
        <h2 className="card-title">核心增长驱动力</h2>
        <div className="drivers-grid">
          {marketData.keyDrivers.map((driver, i) => (
            <div key={i} className="driver-chip" style={{ borderTop: '3px solid #667eea' }}>
              <span>{driver}</span>
            </div>
          ))}
        </div>
        {worldData && (
          <>
            <h3 style={{ fontSize: '1rem', marginTop: '16px', marginBottom: '8px', color: BRAND_DEEP }}>六大正面力量</h3>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {worldData.growthDrivers?.map((d, i) => (
                <div key={i} className="driver-chip" style={{ background: '#f0fdf9', border: '1px solid #d6ece5', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem' }}>
                  <strong>{i+1}.</strong> {d}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Section 8: 结构性窗口 */}
      <section className="card">
        <h2 className="card-title">三大结构性窗口</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {worldData?.structuralWinds?.map((w, i) => (
            <div key={i} style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', borderLeft: `3px solid ${BRAND}` }}>
              <strong style={{ color: BRAND_DEEP }}>窗口{i+1}: {w.title}</strong>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', margin: '4px 0 0 0' }}>{w.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 9: 风险与挑战 */}
      <section className="card">
        <h2 className="card-title">风险与挑战</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {worldData?.risks?.map((r, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #ffe0e0', fontSize: '0.85rem', color: '#666' }}>
              <strong style={{ color: ROSE }}>R{i+1}:</strong> {r}
            </div>
          ))}
        </div>
      </section>

      {/* Section 10: 细分赛道详情 - 原有数据 */}
      <section className="card">
        <h2 className="card-title">细分赛道详情</h2>
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
