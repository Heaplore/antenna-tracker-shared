'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import marketDataRaw from '@/app/_data/market-report.json'
import PageHeader from '@/components/PageHeader'

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

const bodyText = { fontSize: '0.9rem', lineHeight: 1.75, color: '#444', marginTop: '12px' }
const listStyle = { fontSize: '0.88rem', lineHeight: 1.85, color: '#555', paddingLeft: '1.25rem', marginTop: '8px' }
const subTitleStyle = { fontSize: '0.95rem', color: BRAND_DEEP, margin: '18px 0 4px', fontWeight: 600 }

export default function MarketPage() {
  const cr5 = worldData
    ? worldData.vendorMarketShare2024['华为'] + worldData.vendorMarketShare2024['爱立信'] + worldData.vendorMarketShare2024['诺基亚'] + worldData.vendorMarketShare2024['中兴'] + worldData.vendorMarketShare2024['三星']
    : 0

  return (
    <div className="space-y-6">
      {/* Hero */}
      <PageHeader
        title="全球天线行业市场格局深度报告"
        subtitle="Global Antenna Industry Market Landscape · 基于 12 家机构交叉验证"
        updateInfo={`数据更新：${marketData.lastUpdate}`}
      />

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
        <p style={{ ...bodyText, marginTop: '16px' }}>
          在 5G 规模部署、低轨卫星星座爆发、车联网与 Massive MIMO 加速渗透的多重驱动下，全球天线产业进入新一轮成长周期。
          本报告基于 Mordor Intelligence、GII Research、Fortune Business Insights、GMI、QYResearch 等 12 家机构公开数据交叉验证，
          从规模、结构、区域、厂商、技术与风险六个维度进行系统梳理。全球天线市场 2024 年规模约 <strong>223 亿美元</strong>，
          预计以 <strong>7.8% 的 CAGR</strong> 增至 2030 年的 <strong>348 亿美元</strong>（乐观情景突破 400 亿）；
          厂商格局高度集中，<strong>华为以 30% 市占率领跑全球</strong>，<strong>亚太以 45% 份额成为最大市场</strong>。
        </p>
      </section>

      {/* 一、全球天线市场规模与增长曲线 */}
      <section className="card">
        <h2 className="card-title">全球天线市场规模与增长曲线</h2>
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
              <Tooltip formatter={(value: number) => [`${value} 亿美元`, '全球规模']} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} />
              <Area type="monotone" dataKey="global" stroke={BRAND} strokeWidth={2} fill="url(#globalGrad)" activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend-custom">
            <span className="legend-item"><span className="legend-dot" style={{ background: BRAND }}></span>全球市场规模（亿美元）</span>
          </div>
        </div>
        <p style={bodyText}>
          2019–2024 年为历史实绩，2025–2030E 为机构预测区间；复合年均增长率约 7.8%，与全球通信资本开支节奏基本同步，2030 年规模较 2019 年增长约 1.4 倍。
        </p>
        <h3 style={subTitleStyle}>阶段特征</h3>
        <ul style={listStyle}>
          <li>全球 5G 基站部署超 100 万站，驱动天线价值量提升</li>
          <li>疫情冲击下远程办公需求拉动 CPE / 路由器天线</li>
          <li>64T64R / 128T128R AAU 成为新建宏站标配</li>
          <li>单基站天线 ASP 从 ~1.5 万 → 3–5 万元</li>
          <li>中国 / 欧洲开启 6GHz 频段，规模重回加速通道</li>
          <li>低轨星座 + V2X 打开新曲线</li>
        </ul>
      </section>

      {/* 二、下游应用结构与价值分布 */}
      <section className="card">
        <h2 className="card-title">下游应用结构与价值分布</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>2024 年应用场景价值占比</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={appMixData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={1} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {appMixData.map((_, index) => (<Cell key={`cell-${index}`} fill={APP_MIX_COLORS[index % APP_MIX_COLORS.length]} />))}
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
        <p style={bodyText}>
          基站天线仍占据最大单一切片，但卫星与车联占比快速提升，预计 2030 年二者合计有望突破 20%。
        </p>
        <h3 style={subTitleStyle}>关键应用趋势</h3>
        <ul style={listStyle}>
          <li>2024 年宏站 AAU 渗透率超 68%；5G-Advanced 推动 128T / 192T 阵列落地，单价继续上行。</li>
          <li>智能手机 / 平板 / 笔记本；多频段抗干扰 5G 天线是核心增量，2024 年中国口径规模约 32 亿元。</li>
          <li>相控阵渗透率从 2020 年不足 10% 提升至 2024 年 25%+，低轨星座驱动 CAGR ~16%。</li>
          <li>鲨鱼鳍 / V2X / 卫星车联，2024 年全球装机量突破 7400 万件，V2X 细分 CAGR 超 40%。</li>
          <li>国防侧重宽频段抗干扰与有源相控阵；IoT 受 LPWA / NB-IoT / Wi-Fi 7 推动稳健增长。</li>
        </ul>
      </section>

      {/* 三、区域市场格局与重心迁移 */}
      <section className="card">
        <h2 className="card-title">区域市场格局与重心迁移</h2>
        <p style={bodyText}>
          亚太凭借中国 5G SA 网络密度与印度 / 东南亚扩容，承接全球近一半需求；北美以高端与企业级为主，
          单价高、出货占比次之但价值占比较出货占比高约 5 个百分点。
        </p>
        <p style={bodyText}>
          2019–2024 年北美份额从约 24% 回落至 19%，亚太由 40% 提升至 45%+，主因是中国与印度双引擎；
          2025–2030 年随着非洲 4G 深化与海湾 5G 加速，中东非洲份额有望提升 1.5–2 个百分点。
        </p>
      </section>

      {/* 四、厂商竞争格局 */}
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
        <p style={bodyText}>
          市场高度集中，<strong>CR5（华为 + 爱立信 + 诺基亚 + 中兴 + 三星）合计约 {cr5}%</strong>，行业头部集中度高于通信设备整机；
          中国系厂商（华为 / 中兴 / 京信 / 通宇 / 摩比）合计份额约 49%，具备完整供应链与成本优势。
        </p>
        <h3 style={subTitleStyle}>第一梯队 · 全球巨头</h3>
        <ul style={listStyle}>
          <li>华为：AAU / Massive MIMO 全球第一，专利与产能双护城河，覆盖 5G / 5G-A / 微波全场景。</li>
          <li>爱立信：RAN 龙头，Radio 系列在欧美运营商份额稳固；与 Verizon / AT&T 深度绑定。</li>
          <li>诺基亚：AnyRAN + AirScale 主打 Open RAN，欧洲与印度市场占优。</li>
        </ul>
        <h3 style={subTitleStyle}>第二梯队 · 中韩挑战者</h3>
        <ul style={listStyle}>
          <li>中兴：5G-Advanced 大规模天线出货超 50 万套，FWA 接入 2024 年 1.6 亿线，2030 年预测 3.5 亿。</li>
          <li>三星：毫米波与小站领先，Verizon / 日本 KDDI 重要合作伙伴。</li>
          <li>京信通信：小基站与室分天线优势，国内运营商份额持续提升。</li>
        </ul>
        <h3 style={subTitleStyle}>第三梯队 · 专精与新兴</h3>
        <ul style={listStyle}>
          <li>康普（CommScope）：美国本土主力，DAS 与宏站天线并行。</li>
          <li>通宇通讯 / 摩比发展：中国民营专精厂商，性价比 + 海外渠道突围。</li>
          <li>信维通信 / 立讯精密 / 硕贝德：终端天线 + 车载 + 卫星天线多元化布局。</li>
        </ul>
      </section>

      {/* 五、高增长细分赛道 */}
      <section className="card">
        <h2 className="card-title">高增长细分赛道（Massive MIMO / 卫星相控阵 / V2X）</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
            <h3 style={{ fontSize: '0.9rem', color: BRAND_DEEP, marginBottom: '6px' }}>汽车 V2X 天线</h3>
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
              CAGR <strong style={{ color: AMBER }}>{worldData?.hotSegments.v2x?.cagr}</strong> · 早期但增速最高，2030 年预计达{worldData?.hotSegments.v2x?.['2030E']}亿
            </div>
          </div>
        </div>
        <h3 style={subTitleStyle}>Massive MIMO · 主力引擎</h3>
        <ul style={listStyle}>
          <li>从 64T64R 向 128T / 192T 演进，单通道 ASP 与通道数量同步上行。2024–2031 年规模增长近 9 倍。</li>
        </ul>
        <h3 style={subTitleStyle}>卫星相控阵天线 · 高速曲线</h3>
        <ul style={listStyle}>
          <li>Starlink V2 / OneWeb Gen2 / 中国 GW 千帆与 G60 卫星批量入轨，相控阵地面端同步放量。</li>
        </ul>
        <h3 style={subTitleStyle}>汽车 V2X 与鲨鱼鳍天线 · 超高速成长但量级小</h3>
        <ul style={listStyle}>
          <li>V2X 仍处早期，2023 年全球仅 1500 万美元，但 CAGR 高达 40%+；车规级鲨鱼鳍天线装机量 2024 年突破 7400 万件，进入规模化阶段。</li>
          <li>渗透率低：2024 年全球前装 V2X 渗透率仅 5% 左右，2027 年中国新车 C-V2X 强制装配将引爆需求。</li>
          <li>单价高：V2X 模组 + 多频天线合计 ASP 是普通鲨鱼鳍天线的 5–8 倍。</li>
          <li>中国强制政策：2025–2027 年新车 C-V2X 强制装配规划是核心催化剂。</li>
          <li>美国 C-V2X 落地：FCC 2024 年正式划拨 5.9GHz，2026 年开始大规模前装。</li>
        </ul>
      </section>

      {/* 六、技术演进与产品形态 */}
      <section className="card">
        <h2 className="card-title">技术演进与产品形态</h2>
        <h3 style={subTitleStyle}>基站侧</h3>
        <ul style={listStyle}>
          <li>AAU 有源化：无源天线占比从 2020 年 ~70% 回落至 2024 年 ~35%，2030 年预计降至 15% 以下。</li>
          <li>通道数升级：64T64R 成为宏站标配，192T / 256T 阵列进入试点。</li>
          <li>频段拓展：6GHz（n104）中国 2024 年试点，FR3（7–24GHz）成为 6G 候选。</li>
          <li>AI 调优：AI 波束管理降低能耗 15–25%，2025 年起规模化部署。</li>
        </ul>
        <h3 style={subTitleStyle}>终端与卫星侧</h3>
        <ul style={listStyle}>
          <li>多频段抗干扰：Sub-6 + mmWave + Wi-Fi 7 + UWB + 卫星，五合一成为高端机标配。</li>
          <li>可调谐天线：5G + 卫星双模切换成为手机 / 物联网新形态。</li>
          <li>RIS（可重构智能表面）：2024 年市场约 1.4 亿美元，5G-Advanced 与 6G 关键候选技术。</li>
          <li>相控阵卫星终端：Starlink Mini 与车规级平板终端 2024–2026 进入消费市场。</li>
        </ul>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" dataKey="x" name="商业化" domain={[20, 100]} tick={{ fontSize: 11, fill: '#999' }} label={{ value: '商业化进度 ->', position: 'insideBottom', offset: -10, fontSize: 12, fill: BRAND_DEEP }} />
            <YAxis type="number" dataKey="y" name="ASP弹性" domain={[20, 100]} tick={{ fontSize: 11, fill: '#999' }} label={{ value: 'ASP弹性 ->', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: BRAND_DEEP }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name: string, props: any) => {
              if (name === 'x') return [`${props.payload.name}: ${value}`, '商业化']
              if (name === 'y') return [`${value}`, 'ASP弹性']
              return [value, name]
            }} />
            <Scatter data={techData} fill={BRAND} shape="circle">
              {techData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.x > 70 && entry.y > 60 ? BRAND_DEEP : entry.x > 70 ? BRAND : entry.x < 40 ? ROSE : AMBER} />))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p style={bodyText}>
          横轴：商业化进度；纵轴：单天线 ASP 弹性。Massive MIMO 与卫星相控阵均位于高价值弹性 + 高商业化象限，是产业最大利润池。
        </p>
      </section>

      {/* 七、增长驱动因素 */}
      <section className="card">
        <h2 className="card-title">增长驱动因素（六大正面力量）</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {worldData?.growthDrivers?.map((d, i) => (
            <div key={i} className="driver-chip" style={{ background: '#f0fdf9', border: '1px solid #d6ece5', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem' }}>
              <strong>{i + 1}.</strong> {d}
            </div>
          ))}
        </div>
        <h3 style={subTitleStyle}>① 5G 资本开支延长周期</h3>
        <p style={bodyText}>中国 5G-A 规模商用与海外 5G SA 升级将 5G 投资周期延长至 2030 年。</p>
        <h3 style={subTitleStyle}>② 低轨卫星爆发</h3>
        <p style={bodyText}>全球在轨星座规划超 10 万颗，地面相控阵终端与星载天线同步放量。</p>
        <h3 style={subTitleStyle}>③ IoT 设备海量连接</h3>
        <p style={bodyText}>2030 年全球 IoT 设备预计 290 亿台，LPWA / NB-IoT / Wi-Fi 7 多形态天线需求。</p>
        <h3 style={subTitleStyle}>④ 智能汽车电动化</h3>
        <p style={bodyText}>单车天线价值从燃油车 ~$5 提升至智能电动车 $30–80。</p>
        <h3 style={subTitleStyle}>⑤ AI 数据中心</h3>
        <p style={bodyText}>高密度互联推动毫米波点对点回传与高速光铜协同；DC 间无线回传开始试点。</p>
        <h3 style={subTitleStyle}>⑥ 防务与卫星互联网</h3>
        <p style={bodyText}>美国 34% 防务通信需求；防务与卫星互联网是穿越周期的高确定性赛道。</p>
      </section>

      {/* 八、风险与挑战 */}
      <section className="card">
        <h2 className="card-title">风险与挑战</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {worldData?.risks?.map((r, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #ffe0e0', fontSize: '0.85rem', color: '#666' }}>
              <strong style={{ color: ROSE }}>R{i + 1}:</strong> {r}
            </div>
          ))}
        </div>
        <h3 style={subTitleStyle}>结构性风险</h3>
        <ul style={listStyle}>
          <li>地缘政治与出口管制：中美在 5G / 卫星 / 半导体相关天线器件持续摩擦，影响全球供应链。</li>
          <li>频谱碎片化：各国频段分配差异加大多频段天线设计复杂度与成本。</li>
          <li>毫米波落地缓慢：mmWave 部署投入产出比仍待验证，限制高 ASP 弹性兑现。</li>
          <li>价格战：基站天线 CR5 高达 75%，二线厂商面临持续价格压力。</li>
          <li>稀土与原材料：介质陶瓷、LTCC、铁氧体等关键材料价格波动。</li>
          <li>标准不确定性：6G 标准 2030 年前定型概率低，研发投入风险加大。</li>
        </ul>
        <h3 style={subTitleStyle}>机会大于风险 · 三大结构性窗口</h3>
        <ul style={listStyle}>
          <li>2025–2027 年中国 5G-A 规模商用三年，设备升级带动天线单站价值 30–50% 提升。</li>
          <li>消费级相控阵终端 2024–2026 突破价格门槛，2027 年市场规模有望突破 30 亿美元。</li>
          <li>中国新能源车出海带动配套天线厂商海外份额上行，京信 / 通宇 / 信维已布局墨西哥 / 东南亚产能。</li>
        </ul>
      </section>

      {/* 九、2025–2030 五年展望 */}
      <section className="card">
        <h2 className="card-title">2025–2030 五年展望</h2>
        <h3 style={subTitleStyle}>关键判断</h3>
        <ul style={listStyle}>
          <li>整体规模：2030 年全球天线市场规模约 348–370 亿美元，CAGR 7.5–8.0%；不出现重大地缘冲击情景下，区间上限有望突破 400 亿美元。</li>
          <li>价值重心：Massive MIMO 与卫星相控阵合计占比将从 2024 年 ~30% 提升至 2030 年 ~50%，价值结构高度有源化。</li>
          <li>区域格局：亚太份额维持在 45%+，北美 18–20%，欧洲 22%，中东非洲份额提升至 8–9%。</li>
          <li>厂商洗牌：CR5 由 75% 微降至 70%，中兴 / 三星 / 京信抢占边缘份额；中小厂商需在卫星 / V2X / 终端专精领域寻找差异化。</li>
          <li>技术拐点：2027 年前后 RIS（可重构智能表面）完成 5G-A 验证；2028–2030 年进入小规模商用。</li>
          <li>风险提示：出口管制升级、6G 标准延后、宏观经济衰退导致运营商 Capex 推迟。</li>
        </ul>
      </section>

      {/* 数据来源 */}
      <footer style={{ padding: '20px 24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef2f1', fontSize: '0.8rem', color: '#888', lineHeight: 1.7 }}>
        <strong style={{ color: '#666' }}>数据来源：</strong>
        本报告为公开数据交叉整理稿，所有规模、CAGR 与份额数据均来自 12 家机构公开页面（Mordor Intelligence、GII Research、Fortune Business Insights、GMI、QYResearch 等）；不同机构口径差异已在脚注中注明。本报告不构成投资建议。
      </footer>
    </div>
  )
}
