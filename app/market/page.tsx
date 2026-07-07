'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import marketDataRaw from '@/app/_data/market.json'

type WorldMarketData = NonNullable<typeof marketDataRaw.worldMarketData>
type MarketData = typeof marketDataRaw
const marketData = marketDataRaw as MarketData
const worldData = marketData.worldMarketData

const BRAND = '#0FB5A8'
const BRAND_DEEP = '#0A4D5C'
const BRAND_LIGHT = '#5EEAD4'
const BRAND_PALE = '#A7F3D0'
const AMBER = '#FFD166'
const ROSE = '#E76F51'
const APP_MIX_COLORS = [BRAND, BRAND_LIGHT, BRAND_PALE, AMBER, ROSE, '#F4A261', '#C8E6E0']

// Derived chart data from worldMarketData (报告口径，单位：亿美元)
const timelineChartData = worldData ? Object.entries(worldData.marketScale).map(([year, global]) => ({ year, global })) : []
const appMixData = worldData ? Object.entries(worldData.applicationMix2024).map(([name, value]) => ({ name, value })) : []
const regionData = worldData ? Object.entries(worldData.regionalShare2024).map(([name, value]) => ({ name, value })) : []
const vendorData = worldData ? Object.entries(worldData.vendorMarketShare2024).map(([name, value]) => ({ name, value })) : []
const massiveMIMOLine = worldData ? [
  { year: '2024', value: worldData.hotSegments.massiveMIMO['2024'] },
  { year: '2031E', value: worldData.hotSegments.massiveMIMO['2031E'] },
] : []
const satelliteLine = worldData ? [
  { year: '2024', value: worldData.hotSegments.satellitePhasedArray['2024'] },
  { year: '2034E', value: worldData.hotSegments.satellitePhasedArray['2034E'] },
] : []
const v2xLine = worldData ? [
  { year: '2023', value: worldData.hotSegments.v2x['2023'] },
  { year: '2030E', value: worldData.hotSegments.v2x['2030E'] },
] : []
const techData = worldData ? worldData.techMaturity.map(t => ({ name: t.name, x: t.commercialization, y: t.aspElasticity })) : []

export default function MarketPage() {
  const cr5 = worldData
    ? worldData.vendorMarketShare2024['华为'] + worldData.vendorMarketShare2024['爱立信'] + worldData.vendorMarketShare2024['诺基亚'] + worldData.vendorMarketShare2024['中兴'] + worldData.vendorMarketShare2024['三星']
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="market-header">
        <div className="header-content">
          <h1>全球天线产业市场格局深度报告</h1>
          <p>Global Antenna Industry Market Landscape · 基于12家机构交叉验证</p>
          <p className="update-info">数据更新：{marketData.lastUpdate}</p>
        </div>
      </header>

      {/* 执行摘要 */}
      <section className="card">
        <h2 className="card-title">执行摘要</h2>
        <div className="overview-grid">
          <div className="metrics-panel">
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.globalMarketSize2024}</div>
              <div className="metric-label">2024 全球天线市场规模（机构中位）</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.chinaMarketSize2024}</div>
              <div className="metric-label">2024 中国市场规模（人民币）</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.forecast2030}</div>
              <div className="metric-label">2030 年全球预测规模</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{marketData.summary.cagr}</div>
              <div className="metric-label">2019-2030 综合年复合增长率</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{worldData ? Object.keys(worldData.applicationMix2024).length : 0}</div>
              <div className="metric-label">主要应用大类</div>
            </div>
            {marketData.summary.forecastDetail && (
              <div className="metric-item" style={{ fontSize: '0.75rem', color: '#666' }}>
                <div className="metric-value" style={{ fontSize: '0.75rem' }}>
                  {Object.entries(marketData.summary.forecastDetail).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                </div>
                <div className="metric-label">多情景预测范围</div>
              </div>
            )}
          </div>
        </div>
        <p style={{ marginTop: '16px', fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
          全球天线市场 2024 年规模约 <strong>223 亿美元</strong>，预计以 <strong>7.8% 的 CAGR</strong> 增至 2030 年的 <strong>348 亿美元</strong>（乐观情景突破 400 亿）。
          中国市场规模约 <strong>57.7 亿元（人民币）</strong>，是全球产业链核心制造与需求侧之一。
          厂商格局高度集中，<strong>华为以 30% 市占率领跑全球</strong>；区域上<strong>亚太以 45% 份额成为最大市场</strong>。
          增长由 5G-A/6G 资本开支、低轨卫星星座、智能汽车与 AI 数据中心互联共同驱动。
        </p>
      </section>

      {/* 全球市场规模趋势 */}
      <section className="card">
        <h2 className="card-title">全球市场规模趋势（2019-2030E，亿美元）</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="globalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={(v) => `${v}亿`} width={55} />
              <Tooltip
                formatter={(value: number) => [`${value} 亿美元`, '全球规模']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              <Area type="monotone" dataKey="global" stroke={BRAND} strokeWidth={2} fill="url(#globalGrad)" activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend-custom">
            <span className="legend-item"><span className="legend-dot" style={{ background: BRAND }}></span>全球市场规模（亿美元）</span>
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.85rem', lineHeight: 1.7, color: '#666' }}>
          2019 年 145 亿美元增长至 2024 年 223 亿美元，六年间稳健扩张；2025 年起进入机构预测区间，2030E 达 348 亿美元。
          增速中枢约 7.8%，属成熟科技硬件中的中高速增长带。
        </p>
      </section>

      {/* 应用结构与区域分布 */}
      <section className="card">
        <h2 className="card-title">应用结构与区域分布</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>2024 年出货区域占比</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(value: number) => [`${value}%`, '份额']} />
                <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.85rem', lineHeight: 1.7, color: '#666' }}>
          <strong>应用端</strong>：基站天线以 35% 占比居首，终端与移动设备 22% 次之，卫星与航天（12%）、汽车天线（10%）为结构性增量来源。
          <strong>区域端</strong>：亚太以 45% 领跑，欧洲 22%、北美 19% 跟随，拉美与中东及非洲各占 7%——亚太既是最大生产侧也是最大需求侧。
        </p>
      </section>

      {/* 厂商竞争格局 */}
      <section className="card">
        <h2 className="card-title">厂商竞争格局（2024 市占率）</h2>
        <div className="chart-panel-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(value: number) => [`${value}%`, '市占率']} />
              <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} background={{ fill: '#f0f0f0' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.85rem', lineHeight: 1.7, color: '#666' }}>
          市场高度集中，<strong>CR5（华为+爱立信+诺基亚+中兴+三星）合计约 {cr5}%</strong>。华为以 30% 绝对领先，爱立信（18%）、诺基亚（12%）守欧洲基本盘，
          中兴（9%）、三星（6%）及京信通信（5%）、通宇通讯（3%）、摩比发展（2%）组成中国军团，在 5G-A 与出海产能上构成主要变量。
        </p>
      </section>

      {/* 高增长细分赛道 */}
      <section className="card">
        <h2 className="card-title">高增长细分赛道（Massive MIMO / 卫星相控阵 / V2X）</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
        <p style={{ marginTop: '12px', fontSize: '0.85rem', lineHeight: 1.7, color: '#666' }}>
          <strong>Massive MIMO</strong>（CAGR 34%）与<strong>卫星相控阵</strong>（15.6%）是确定性最高的两条赛道；
          <strong>V2X</strong> 当前基数极小（2023 年仅 0.015 亿美元）但 CAGR 高达 40.3%，是智能汽车渗透带来的远期高增长期权。
        </p>
      </section>

      {/* 技术成熟度象限 */}
      <section className="card">
        <h2 className="card-title">技术成熟度象限（商业化进度 vs ASP弹性）</h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>Massive MIMO 与卫星相控阵位于高商业价值象限，是产业最大利润池；RIS 可重构智能表面等处于早期但弹性高，是远期布局点。</p>
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

      {/* 增长驱动力 */}
      <section className="card">
        <h2 className="card-title">核心增长驱动力（六大正面力量）</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {worldData?.growthDrivers?.map((d, i) => (
            <div key={i} className="driver-chip" style={{ background: '#f0fdf9', border: '1px solid #d6ece5', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem' }}>
              <strong>{i + 1}.</strong> {d}
            </div>
          ))}
        </div>
      </section>

      {/* 结构性窗口 */}
      <section className="card">
        <h2 className="card-title">三大结构性窗口</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {worldData?.structuralWinds?.map((w, i) => (
            <div key={i} style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', borderLeft: `3px solid ${BRAND}` }}>
              <strong style={{ color: BRAND_DEEP }}>窗口{i + 1}: {w.title}</strong>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', margin: '4px 0 0 0' }}>{w.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 风险与挑战 */}
      <section className="card">
        <h2 className="card-title">风险与挑战</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {worldData?.risks?.map((r, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #ffe0e0', fontSize: '0.85rem', color: '#666' }}>
              <strong style={{ color: ROSE }}>R{i + 1}:</strong> {r}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
