'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import { useEffect, useRef, useState } from 'react'

// ─── TRAE Report Content (from antenna-industry-report.html) ───
const REPORT_TITLE = '全球天线行业市场格局及技术发展现状趋势'
const REPORT_SUBTITLE = '从5G建设高峰期到5G-A/6G过渡期的系统性分析：市场规模、竞争格局、技术演进与未来展望'
const REPORT_DATE = '2026-07'
const REPORT_AUTHOR = '银月（TRAE Agent）'

// Key metrics from report
const KEY_METRICS = [
  { value: '641亿', label: '中国通信天线2024年市场规模(元)', color: '' },
  { value: '21.0%', label: '全球Massive MIMO AAU市场CAGR', color: 'green' },
  { value: '44.2%', label: '全球5G相控阵天线市场CAGR', color: 'orange' },
  { value: '29.4%', label: '华为国内基站天线市场份额', color: '' },
]

// Chart data
const marketSizeData = [
  { year: '2023', china: 627, aaU: null, phased: null },
  { year: '2024', china: 641.3, aaU: 16.25, phased: null },
  { year: '2025E', china: 658, aaU: 21, phased: null },
  { year: '2026E', china: 675, aaU: 27, phased: null },
  { year: '2027E', china: 695, aaU: 34, phased: null },
  { year: '2028E', china: 718, aaU: 41, phased: null },
  { year: '2029E', china: 745, aaU: 47, phased: null },
  { year: '2030E', china: 770, aaU: 51, phased: 5.95 },
  { year: '2031E', china: 800, aaU: 53.12, phased: null },
]

const marketShareData = [
  { name: '华为', value: 29.4 },
  { name: '中兴通讯', value: 18.6 },
  { name: '通宇通讯', value: 14.2 },
  { name: '京信通信', value: 12.0 },
  { name: '摩比发展', value: 8.0 },
  { name: 'Commscope', value: 7.8 },
  { name: '爱立信', value: 5.0 },
  { name: '其他', value: 5.0 },
]

const cagrData = [
  { name: '全球5G天线', cagr: -1.3 },
  { name: '中国通信天线', cagr: 2.3 },
  { name: '全球5G-A AAU', cagr: 21.0 },
  { name: '全球5G相控阵天线', cagr: 44.2 },
  { name: '全球5G设备整体', cagr: 81.05 },
]

const techRoadmapData = [
  { name: '传统基站天线', start: 2019, end: 2024, desc: '2G/3G/4G 延续至今' },
  { name: 'Massive MIMO AAU', start: 2019, end: 2027, desc: '当前主流，向192T192R演进' },
  { name: '毫米波天线', start: 2020, end: 2026, desc: '热点覆盖为主，LEO卫星驱动爆发' },
  { name: '5G-A 通感一体化', start: 2024, end: 2028, desc: '5G-A商用元年，通信+感知融合' },
  { name: 'RIS 智能超表面', start: 2024, end: 2030, desc: '2026-27小规模商用，2030+6G标配' },
  { name: '太赫兹天线', start: 2025, end: 2031, desc: '6G核心频段，当前预研阶段' },
  { name: '空天地一体化', start: 2024, end: 2030, desc: '卫星直连手机+星地融合' },
  { name: 'AI 原生天线', start: 2025, end: 2031, desc: 'AI辅助波束管理/信道估计' },
]

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#5a6070', '#2563eb', '#5a6070']
const ACCENT = '#2563eb'
const ACCENT2 = '#059669'
const INK = '#1a1a2e'
const MUTED = '#5a6070'
const RULE = '#e2e5ea'
const BG2 = '#f8f9fb'

// ─── Component ───────────────────────────────────────────────────
export default function HomePage() {
  const chartRefs = useRef<{ market?: HTMLDivElement | null; share?: HTMLDivElement | null; cagr?: HTMLDivElement | null; roadmap?: HTMLDivElement | null }>({})
  const [echartsLoaded, setEchartsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).echarts) { setEchartsLoaded(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js'
    s.onload = () => setEchartsLoaded(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!echartsLoaded || !chartRefs.current.market) return
    const echarts = (window as any).echarts

    // Chart 1: Market Size Growth
    const mc = echarts.init(chartRefs.current.market!, null, { renderer: 'svg' })
    mc.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['中国通信天线(亿元RMB)', '全球Massive MIMO AAU(亿美元)', '全球5G相控阵天线(亿美元)'], textStyle: { color: INK, fontSize: 11 } },
      grid: { left: 50, right: 30, top: 60, bottom: 40 },
      xAxis: { type: 'category', data: ['2023','2024','2025E','2026E','2027E','2028E','2029E','2030E','2031E'], axisLabel: { color: MUTED, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '亿元 RMB', nameTextStyle: { color: MUTED, fontSize: 10 }, axisLabel: { color: MUTED, fontSize: 10 }, splitLine: { lineStyle: { color: RULE } } },
        { type: 'value', name: '亿美元', nameTextStyle: { color: MUTED, fontSize: 10 }, axisLabel: { color: MUTED, fontSize: 10 }, splitLine: { show: false } }
      ],
      series: [
        { name: '中国通信天线(亿元RMB)', type: 'line', smooth: true, data: [627,641.3,658,675,695,718,745,770,800], lineStyle: { color: ACCENT, width: 2 }, itemStyle: { color: ACCENT }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: ACCENT+'33' }, { offset: 1, color: ACCENT+'05' }] } }, symbol: 'circle', symbolSize: 6 },
        { name: '全球Massive MIMO AAU(亿美元)', type: 'line', smooth: true, yAxisIndex: 1, data: [null,16.25,21,27,34,41,47,51,53.12], lineStyle: { color: ACCENT2, width: 2 }, itemStyle: { color: ACCENT2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: ACCENT2+'33' }, { offset: 1, color: ACCENT2+'05' }] } }, symbol: 'circle', symbolSize: 6 },
        { name: '全球5G相控阵天线(亿美元)', type: 'line', smooth: true, yAxisIndex: 1, data: [null,null,null,null,null,null,null,5.95,null], lineStyle: { color: MUTED, width: 2, type: 'dashed' }, itemStyle: { color: MUTED }, symbol: 'diamond', symbolSize: 8 }
      ]
    })

    // Chart 2: Market Share Pie
    const pc = echarts.init(chartRefs.current.share!, null, { renderer: 'svg' })
    pc.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 20, top: 'center', textStyle: { color: INK, fontSize: 11 }, data: ['华为','中兴通讯','通宇通讯','京信通信','摩比发展','Commscope','爱立信','其他'] },
      series: [{
        type: 'pie', radius: ['40%','70%'], center: ['35%','50%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: BG2, borderWidth: 2 },
        label: { show: true, position: 'outside', formatter: '{b}\n{d}%', color: INK, fontSize: 11 },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
        data: marketShareData.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i] } }))
      }]
    })

    // Chart 3: CAGR Bar
    const bc = echarts.init(chartRefs.current.cagr!, null, { renderer: 'svg' })
    bc.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 40, top: 20, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { color: MUTED, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: RULE } } },
      yAxis: { type: 'category', data: cagrData.map(d => d.name), axisLabel: { color: INK, fontSize: 10 } },
      series: [{
        type: 'bar', barWidth: 20,
        data: [
          { value: -1.3, itemStyle: { color: MUTED } },
          { value: 2.3, itemStyle: { color: MUTED } },
          { value: 21.0, itemStyle: { color: ACCENT } },
          { value: 44.2, itemStyle: { color: ACCENT2 } },
          { value: 81.05, itemStyle: { color: '#d97706' } }
        ],
        label: { show: true, position: 'right', formatter: '{c}%', color: INK, fontSize: 11, fontWeight: 'bold' }
      }]
    })

    // Chart 4: Tech Roadmap Gantt
    const rc = echarts.init(chartRefs.current.roadmap!, null, { renderer: 'svg' })
    const tNames = techRoadmapData.map(d => d.name)
    const tStart = techRoadmapData.map(d => d.start)
    const tEnd = techRoadmapData.map(d => d.end)
    const tDesc = techRoadmapData.map(d => d.desc)
    const tColors = [MUTED, ACCENT, ACCENT+'cc', ACCENT2, ACCENT2+'cc', '#d97706', '#d97706cc', '#7c3aed']
    rc.setOption({
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: any[]) => {
          const i = p[0].dataIndex
          return tNames[i]+'<br/>'+tDesc[i]+'<br/>'+tStart[i]+' → '+tEnd[i]
        }
      },
      grid: { left: 160, right: 200, top: 20, bottom: 40 },
      xAxis: {
        type: 'value', min: 2018.5, max: 2031.5,
        axisLabel: { color: MUTED, fontSize: 10, formatter: '{value}' },
        splitLine: { lineStyle: { color: RULE, type: 'dashed' } },
        axisLine: { lineStyle: { color: RULE } }
      },
      yAxis: {
        type: 'category', data: tNames,
        axisLabel: { color: INK, fontSize: 11 },
        axisLine: { lineStyle: { color: RULE } }
      },
      series: [{
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const yIndex = params.dataIndex
          const startY = tStart[yIndex]
          const endY = tEnd[yIndex]
          const startCoord = api.coord([startY, yIndex])
          const endCoord = api.coord([endY, yIndex])
          return {
            type: 'rect',
            shape: { x: startCoord[0], y: startCoord[1]-7, width: Math.max(endCoord[0]-startCoord[0], 1), height: 14, r: 3 },
            style: api.style({ fill: tColors[yIndex] })
          }
        },
        data: tNames.map((_, i) => i),
        label: {
          show: true, position: 'right',
          formatter: (p: any) => {
            const i = p.dataIndex
            return tStart[i]+' → '+tEnd[i]+': '+tDesc[i]
          },
          fontSize: 9, color: INK, overflow: 'truncate'
        }
      }]
    })

    const onResize = () => { mc.resize(); pc.resize(); bc.resize(); rc.resize() }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); mc.dispose(); pc.dispose(); bc.dispose(); rc.dispose() }
  }, [echartsLoaded])

  return (
    <div className="space-y-6">
      {/* Header — 沿用原 market-header 样式 */}
      <header className="market-header">
        <div className="header-content">
          <h1>{REPORT_TITLE}</h1>
          <p>{REPORT_SUBTITLE}</p>
          <p className="update-info">数据更新：{REPORT_DATE}</p>
        </div>
      </header>

      {/* Key Metrics — 沿用原 overview-grid / metrics-panel */}
      <section className="card">
        <h2 className="card-title">执行摘要</h2>
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {KEY_METRICS.map((m, i) => (
            <div key={i} className="metric-card" style={{
              background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '1.5rem', textAlign: 'center'
            }}>
              <div style={{ fontFamily: "'Big Shoulders', system-ui, sans-serif", fontSize: '2.2rem', fontWeight: 700, color: m.color === 'green' ? ACCENT2 : m.color === 'orange' ? '#d97706' : ACCENT, lineHeight: 1, marginBottom: '0.3rem' }}>{m.value}</div>
              <div style={{ fontSize: '0.78rem', color: MUTED, lineHeight: 1.3 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '16px', fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
          全球天线行业正处于历史性转折点：5G建设高峰期已过，但5G-A商用化带来Massive MIMO AAU升级周期。
          Massive MIMO AAU市场CAGR 21.0%，相控阵天线CAGR高达44.2%。
          中国通信天线2024年市场规模641亿元，华为在国内基站天线市场份额达29.4%。
        </p>
      </section>

      {/* Section 1: 行业概述 */}
      <section className="card">
        <h2 className="card-title">一、行业概述</h2>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#444', marginBottom: '12px' }}>
          天线是无线通信系统的核心部件，负责将电信号转换为电磁波（发射）或将电磁波转换为电信号（接收）。随着移动通信从2G向5G-A和6G演进，天线技术经历了从<span style={{ color: ACCENT, fontWeight: 600 }}>传统定向/全向天线到大规模MIMO有源天线（AAU）</span>的深刻变革。
        </p>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>1.1 天线产品分类</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '400px', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>分类维度</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>类型</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>说明</th></tr>
            </thead>
            <tbody>
              {[
                ['应用场景', '基站天线', '地面蜂窝网络基站使用'],
                ['', '移动终端天线', '手机、车载终端、IoT设备'],
                ['', '卫星天线', '低轨/高轨卫星通信'],
                ['', '室内小基站天线', '室内覆盖增强'],
                ['频段', 'Sub-6GHz天线', '支持FR1频段（<6GHz）'],
                ['', '毫米波天线', '支持FR2频段（24-100GHz）'],
                ['', '太赫兹天线', '6G预研方向（>100GHz）'],
                ['技术形态', '无源天线', '传统反射/透射结构'],
                ['', '有源天线（AAU）', '集成射频前端，支持Massive MIMO'],
                ['', '智能超表面（RIS）', '可编程电磁调控，6G关键技术'],
              ].map(([dim, type, desc], i) => (
                <tr key={i}><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}` }}>{dim}</td><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{type}</td><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}`, color: '#666' }}>{desc}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: 市场规模与增长预测 */}
      <section className="card">
        <h2 className="card-title">二、市场规模与增长预测</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>2.1 全球天线市场总体规模</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '400px', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>细分市场</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>基期规模</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>预测期规模</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>CAGR</th></tr>
            </thead>
            <tbody>
              {[
                ['中国通信天线行业', '641亿元RMB (2024)', '—', '2.3% (YoY)'],
                ['全球5G天线', '144亿元RMB (2023)', '142.9亿元RMB (2030)', '-1.3%'],
                ['全球Massive MIMO AAU', '16.25亿美元 (2024)', '53.12亿美元 (2031)', '21.0%'],
                ['全球5G相控阵天线', '基数较小', '5.95亿美元 (2030)', '44.2%'],
                ['全球5G设备整体', '—', '+1469.5亿美元 (2028)', '81.05%'],
              ].map(([seg, base, forecast, cagr], i) => (
                <tr key={i}><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{seg}</td><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}` }}>{base}</td><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}` }}>{forecast}</td><td style={{ padding: '6px 12px', borderBottom: `1px solid ${RULE}` }}>{cagr}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderLeft: `4px solid ${ACCENT}`, background: BG2, padding: '12px 16px', margin: '12px 0', borderRadius: '0 6px 6px 0' }}>
          <strong style={{ color: ACCENT }}>关键洞察：</strong>
          <span style={{ fontSize: '0.88rem', color: '#444' }}>全球5G天线市场整体趋于饱和（CAGR -1.3%），但<strong>Massive MIMO AAU升级</strong>和<strong>相控阵天线</strong>呈现高速增长，市场结构性分化明显。</span>
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>2.2 区域市场分析</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {[
            { flag: '🇨🇳', title: '中国', items: ['全球最大5G市场', '5G连接数超10亿（2024年底）', '基站天线国产化率超80%', '5G-A商用元年（2024）'] },
            { flag: '🌍', title: '北美', items: ['5G部署以毫米波为主', '运营商Capex增长推动需求', 'Starlink等LEO星座带动卫星天线'] },
            { flag: '🇪🇺', title: '欧洲', items: ['爱立信、诺基亚为本土供应商', '5G部署进度相对缓慢', '6G旗舰项目Hexa-X推进中'] },
            { flag: '🌏', title: '亚太（除中国）', items: ['印度5G BTS部署突破45万', '东南亚/中东加速5G建设', '新兴市场渗透率提升空间大'] },
          ].map((r, i) => (
            <div key={i} style={{ background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>{r.flag} {r.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {r.items.map((item, j) => <li key={j} style={{ padding: '4px 0', fontSize: '0.85rem', color: MUTED, borderBottom: `1px solid ${RULE}` }}><span style={{ color: ACCENT, marginRight: '4px' }}>▸</span>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>2.3 增长驱动因素</h3>
        <ol style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444', marginBottom: '16px' }}>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>5G-A商用化</span> — 2024年被定义为"5G-A商用元年"，3GPP R18标准冻结</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>卫星互联网爆发</span> — Starlink、Kuiper等LEO mega-constellation建设带动相控阵天线需求</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>6G预研投入</span> — 中国2025年《政府工作报告》将6G纳入未来产业规划</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>AI融合</span> — AI for network / network for AI成为6G主线</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>物联网/IoT扩展</span> — 海量IoT设备连接催生新型终端天线需求</li>
        </ol>
        {/* Chart 1: Market Size */}
        <div style={{ margin: '24px 0', background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: INK, marginBottom: '12px', textAlign: 'center' }}>图1：主要天线细分市场增长趋势对比（2023-2031）</div>
          <div ref={el => { chartRefs.current.market = el }} style={{ width: '100%', minHeight: 360 }} />
        </div>
      </section>

      {/* Section 3: 竞争格局 */}
      <section className="card">
        <h2 className="card-title">三、竞争格局分析</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>3.1 全球竞争梯队</h3>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>第一梯队（全球领导者）</h4>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444' }}>
            <li><strong style={{ color: ACCENT }}>华为</strong> — 全球基站天线份额约29.4%，5G核心技术领先</li>
            <li><strong style={{ color: ACCENT }}>爱立信</strong> — 瑞典，全球5G网络设备主要供应商之一</li>
            <li><strong style={{ color: ACCENT }}>康普/CommScope</strong> — 美国，全球领先的无源天线供应商</li>
            <li><strong style={{ color: ACCENT }}>诺基亚</strong> — 芬兰，5G网络设备供应商</li>
          </ul>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>第二梯队（专业天线厂商）</h4>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444' }}>
            <li><strong style={{ color: ACCENT2 }}>中兴通讯</strong> — 中国，国内市场份额约18.6%</li>
            <li><strong style={{ color: ACCENT2 }}>通宇通讯</strong> — 中国，国内市场份额约14.2%，全球基站天线细分领域前五</li>
            <li><strong style={{ color: ACCENT2 }}>京信通信</strong> — 中国香港，基站天线市场重要参与者</li>
            <li><strong style={{ color: ACCENT2 }}>摩比发展</strong> — 中国，天线及射频组件供应商</li>
            <li><strong style={{ color: ACCENT2 }}>安费诺</strong> — 美国，连接器及天线产品</li>
          </ul>
        </div>
        <div style={{ borderLeft: `4px solid ${ACCENT2}`, background: BG2, padding: '12px 16px', margin: '12px 0', borderRadius: '0 6px 6px 0' }}>
          <strong style={{ color: ACCENT2 }}>高度集中：</strong>
          <span style={{ fontSize: '0.88rem', color: '#444' }}>2024年，华为、京信通信、通宇通讯等企业在基站天线市场的合计份额超过80%。</span>
        </div>
        {/* Chart 2: Market Share Pie */}
        <div style={{ margin: '24px 0', background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: INK, marginBottom: '12px', textAlign: 'center' }}>图2：中国基站天线市场主要企业份额分布（2024年）</div>
          <div ref={el => { chartRefs.current.share = el }} style={{ width: '100%', minHeight: 360 }} />
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>3.3 竞争态势总结</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '300px', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>趋势</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>影响</th></tr>
            </thead>
            <tbody>
              {[
                ['5G建设高峰期已过', '全球5G基站部署进入后期，天线市场从增量转向存量替换+升级'],
                ['5G-A带来新机遇', 'Massive MIMO AAU升级、通感一体化天线、RIS等新技术催生新一轮需求'],
                ['卫星天线成新增长极', 'LEO星座建设带动相控阵天线需求快速增长（CAGR 44.2%）'],
                ['中国企业崛起', '华为、中兴、通宇通讯等在全球市场份额持续提升，国产化替代加速'],
              ].map(([trend, impact], i) => (
                <tr key={i}><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{trend}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, color: '#666' }}>{impact}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: 技术发展现状 */}
      <section className="card">
        <h2 className="card-title">四、技术发展现状</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>4.1 5G天线技术现状</h3>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Massive MIMO AAU（主流技术）</h4>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#444', marginBottom: '12px' }}>
          <span style={{ color: ACCENT, fontWeight: 600 }}>有源天线单元</span>，集成射频前端与数字波束赋形，支持64T64R、192T192R等大规模天线阵列。当前5G基站主流天线形态，2024年市场规模约16.25亿美元。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { title: '演进路径', desc: '4T4R → 64T64R → 192T192R（通道数持续增加）' },
            { title: '频段覆盖', desc: 'Sub-6GHz（n77/n78/n79）+ 毫米波（n257/n258/n261）' },
            { title: 'AI赋能', desc: '集成AI算法实现智能波束管理' },
          ].map((item, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${ACCENT}`, padding: '8px 12px', background: BG2, borderRadius: '4px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: ACCENT }}>{item.title}</div>
              <div style={{ fontSize: '0.82rem', color: MUTED }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>相控阵天线（Phased Array）</h4>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#444', marginBottom: '12px' }}>
          <span style={{ color: ACCENT, fontWeight: 600 }}>通过控制阵列天线各单元的相位差实现波束扫描</span>。应用包括卫星通信（Starlink用户终端）、5G毫米波基站、车联网。2024-2030年CAGR达44.2%。
        </p>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>4.2 5G-A（5.5G）天线技术</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { title: '三载波聚合', desc: '提升频谱效率' },
            { title: '通感一体化（ISAC）', desc: '天线同时支持通信和感知功能' },
            { title: 'RedCap天线', desc: '面向中等速率IoT场景优化' },
            { title: 'XR/裸眼3D专网天线', desc: '面向沉浸式应用优化' },
          ].map((item, i) => (
            <div key={i} style={{ background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: ACCENT }}>{item.title}</div>
              <div style={{ fontSize: '0.82rem', color: MUTED }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>4.3 6G天线前沿技术</h3>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>智能超表面（RIS/IRS）</h4>
        <div style={{ borderLeft: `4px solid ${ACCENT}`, background: BG2, padding: '12px 16px', margin: '8px 0 16px', borderRadius: '0 6px 6px 0' }}>
          <strong style={{ color: ACCENT }}>核心原理：</strong>
          <span style={{ fontSize: '0.88rem', color: '#444' }}>由大量可编程电磁单元构成的平面结构，通过调控单元参数实现电磁波的反射/透射幅度和相位分布控制。<span style={{ color: ACCENT, fontWeight: 600 }}>被认为是6G关键技术之一</span>。</span>
        </div>
        <ul style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444', marginBottom: '16px' }}>
          <li><strong>优势：</strong>低成本、低能耗、易部署</li>
          <li><strong>突破：</strong>清华大学张平武团队提出STAR-RIS（同时透射和反射），实现360°覆盖</li>
          <li><strong>产业化：</strong>中兴Dynamic RIS 2.0已发布；中国移动+中兴在杭州亚运会完成全球首个大型赛事RIS部署</li>
          <li><strong>标准化：</strong>3GPP Rel-18/19开始讨论RIS相关增强功能</li>
        </ul>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>太赫兹天线</h4>
        <ul style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444', marginBottom: '16px' }}>
          <li>频段：&gt;100GHz（0.1-10THz）</li>
          <li>意义：6G核心频段，提供超大带宽</li>
          <li>进展：华为220GHz太赫兹通感一体化原型机实现240Gbps传输速率</li>
        </ul>
        {/* Chart 3: CAGR */}
        <div style={{ margin: '24px 0', background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: INK, marginBottom: '12px', textAlign: 'center' }}>图3：主要天线细分市场年复合增长率对比</div>
          <div ref={el => { chartRefs.current.cagr = el }} style={{ width: '100%', minHeight: 300 }} />
        </div>
      </section>

      {/* Section 5: 产业链分析 */}
      <section className="card">
        <h2 className="card-title">五、产业链分析</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>5.1 上游：原材料与元器件</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '300px', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>环节</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>关键材料/器件</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>主要供应商</th></tr>
            </thead>
            <tbody>
              {[
                ['基板材料', 'PCB/FPC、陶瓷基板', '深南电路、沪电股份、鹏鼎控股'],
                ['射频芯片', 'PA、LNA、Switch、Filter', '高通、博通、Skyworks、卓胜微'],
                ['连接器', '射频连接器', '罗森伯格、安费诺、意华股份'],
                ['天线振子', '金属贴片、介质材料', '通宇通讯、京信通信自产'],
              ].map(([h, mat, sup], i) => (
                <tr key={i}><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{h}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}` }}>{mat}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, color: '#666' }}>{sup}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>5.2 下游：应用市场</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '300px', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>应用领域</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>代表客户</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>天线需求特点</th></tr>
            </thead>
            <tbody>
              {[
                ['运营商网络', '中国移动、Verizon、Vodafone', '大规模Massive MIMO AAU'],
                ['卫星互联网', 'SpaceX/Starlink、Amazon/Kuiper', '相控阵天线'],
                ['终端设备', '苹果、三星、华为、小米', '小型化多频终端天线'],
                ['车联网/物联网', '车企、IoT设备商', '低频段、低功耗天线'],
                ['国防军工', '各国军方', '高可靠、抗干扰天线'],
              ].map(([app, client, feature], i) => (
                <tr key={i}><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{app}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}` }}>{client}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, color: '#666' }}>{feature}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: 技术发展路线图 */}
      <section className="card">
        <h2 className="card-title">六、技术发展路线图</h2>
        {/* Chart 4: Tech Roadmap */}
        <div style={{ margin: '24px 0', background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: INK, marginBottom: '12px', textAlign: 'center' }}>图4：天线技术发展路线图（2019-2031）</div>
          <div ref={el => { chartRefs.current.roadmap = el }} style={{ width: '100%', minHeight: 420 }} />
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>关键时间节点</h3>
        <div style={{ paddingLeft: '16px', marginBottom: '16px' }}>
          {[
            { year: '2019年', desc: '全球5G商用元年，Massive MIMO AAU开始部署' },
            { year: '2024年', desc: '5G-A商用元年，3GPP R18标准冻结' },
            { year: '2025年', desc: '中国将6G纳入《政府工作报告》，工信部推进6G研发' },
            { year: '2028-2029年', desc: '6G标准制定关键期' },
            { year: '2030年及以后', desc: '6G商用部署' },
          ].map((item, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '12px', paddingLeft: '16px' }}>
              <div style={{ position: 'absolute', left: '-12px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: ACCENT, border: `2px solid white` }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: ACCENT }}>{item.year}</div>
              <div style={{ fontSize: '0.85rem', color: MUTED }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7: 挑战与风险 */}
      <section className="card">
        <h2 className="card-title">七、挑战与风险</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>7.1 技术挑战</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { title: '高频段传播损耗', desc: '毫米波/太赫兹频段穿透损耗大，覆盖半径小' },
            { title: 'RIS硬件可靠性', desc: 'PIN管/液晶材料长期运行稳定性待验证' },
            { title: '信道估计复杂度', desc: 'BS-RIS-UE级联信道估计困难，导频开销大' },
            { title: '功耗与散热', desc: 'Massive MIMO AAU功耗显著高于传统架构' },
          ].map((item, i) => (
            <div key={i} style={{ background: BG2, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: ACCENT }}>{item.title}</div>
              <div style={{ fontSize: '0.82rem', color: MUTED, marginTop: '4px' }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>7.2 市场与供应链风险</h3>
        <div style={{ borderLeft: `4px solid #d97706`, background: BG2, padding: '12px 16px', margin: '12px 0', borderRadius: '0 6px 6px 0' }}>
          <strong style={{ color: '#d97706' }}>地缘政治：</strong>
          <span style={{ fontSize: '0.88rem', color: '#444' }}>华为、中兴在海外市场的受限影响全球份额。高端射频芯片（PA/LNA）仍依赖海外供应商（高通、博通等），自主可控是下一步重点。</span>
        </div>
      </section>

      {/* Section 8: 未来展望 */}
      <section className="card">
        <h2 className="card-title">八、未来展望</h2>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>六大趋势判断</h3>
        <ol style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#444', marginBottom: '16px' }}>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>Massive MIMO持续演进</span> — 通道数从64T64R向192T192R甚至更高演进，AAU市场CAGR 21.0%</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>RIS从实验室走向商用</span> — 预计2026-2027年小规模商用，2030年后成为6G标配</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>卫星天线成新蓝海</span> — LEO星座建设驱动相控阵天线市场CAGR 44.2%</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>AI深度融合</span> — AI辅助波束管理、信道估计将成为5G-A/6G天线标配能力</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>通感一体化</span> — 天线同时支持通信和感知功能，开辟新应用场景</li>
          <li><span style={{ color: ACCENT, fontWeight: 600 }}>国产化替代加速</span> — 中国天线企业全球份额持续提升</li>
        </ol>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: ACCENT, marginBottom: '8px' }}>重点关注企业</h3>
        <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: '300px', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>企业</th><th style={{ background: BG2, color: ACCENT, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}` }}>投资逻辑</th></tr>
            </thead>
            <tbody>
              {[
                ['华为', '5G/5G-A/6G全栈技术领先，天线自研自产'],
                ['中兴通讯', '自研自产一体化，Dynamic RIS 2.0领先'],
                ['通宇通讯', '全球基站天线前五，受益5G-A升级周期'],
                ['信维通信', '终端天线龙头，拓展卫星/汽车天线'],
                ['盛路通信', '689项RIS专利储备，卫星/军工双轮驱动'],
                ['Commscope', '全球无源天线龙头，受益5G-A升级'],
              ].map(([comp, logic], i) => (
                <tr key={i}><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, fontWeight: 500 }}>{comp}</td><td style={{ padding: '8px 12px', borderBottom: `1px solid ${RULE}`, color: '#666' }}>{logic}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 9: 结论 */}
      <section className="card" style={{ background: 'linear-gradient(135deg, var(--bg2, #f8f9fb), white)', border: `1px solid ${ACCENT}`, borderRadius: '12px' }}>
        <h2 className="card-title">九、结论</h2>
        <p style={{ fontSize: '0.95rem', color: '#444', marginBottom: '12px' }}>全球天线行业正处于<span style={{ color: ACCENT, fontWeight: 700 }}>历史性转折点</span>：</p>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '12px' }}>
          <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.88rem', color: '#444', borderBottom: `1px solid ${RULE}` }}>
            <span style={{ position: 'absolute', left: 0, color: ACCENT }}>✦</span>
            <strong>短期（2024-2026）</strong>：5G建设高峰期已过，但5G-A商用化带来Massive MIMO AAU升级周期，市场结构性增长
          </li>
          <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.88rem', color: '#444', borderBottom: `1px solid ${RULE}` }}>
            <span style={{ position: 'absolute', left: 0, color: ACCENT }}>✦</span>
            <strong>中期（2026-2028）</strong>：RIS技术从小规模试点走向商用，卫星相控阵天线需求爆发
          </li>
          <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.88rem', color: '#444' }}>
            <span style={{ position: 'absolute', left: 0, color: ACCENT }}>✦</span>
            <strong>长期（2028-2030+）</strong>：6G标准制定完成，太赫兹天线、智能超表面、空天地一体化天线成为主流
          </li>
        </ul>
        <p style={{ fontSize: '0.85rem', color: MUTED, borderTop: `1px solid ${RULE}`, paddingTop: '12px' }}>中国企业在全球天线产业链中的地位持续提升，华为、中兴、通宇通讯等已具备全球竞争力。未来竞争焦点将从"硬件制造"转向"AI+天线"的系统级创新能力。</p>
      </section>

      {/* References */}
      <footer style={{ marginTop: '32px', padding: '24px 0', borderTop: `1px solid ${RULE}` }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: ACCENT, marginBottom: '12px' }}>参考资料</h3>
        <ol style={{ paddingLeft: '1.5rem', fontSize: '0.82rem', lineHeight: 1.8, color: MUTED }}>
          <li>[二级资料] 中国通信天线行业市场规模分析：2023年627亿元→2024年641.3亿元（豆丁网行业报告）</li>
          <li>[二级资料] 全球5G天线行业规模及市场占有率分析报告（格隆汇 / QY Research）</li>
          <li>[二级资料] 全球Massive MIMO 5G AAU有源天线单元市场规模报告（格隆汇）</li>
          <li>[二级资料] 全球与中国5G相控阵天线市场调查报告2024-2030（QYR恒州博智）</li>
          <li>[二级资料] Technavio: 2024-2028全球5G设备市场增长1469.5亿美元</li>
          <li>[行业报道] 华为李鹏MWC2024: 2024年是5G-A商用元年，全球5G用户超15亿</li>
          <li>[官方] 2025年中国《政府工作报告》将6G纳入未来产业规划，工信部推进6G研发</li>
          <li>[二级资料] 2024年中国天线市场竞争格局：华为29.4%、中兴18.6%、通宇14.2%</li>
          <li>[行业报道] 通宇通讯: 全球基站天线细分领域前五，华为/中兴/爱立信/诺基亚供应商</li>
          <li>[行业报道] 盛路通信: 689项RIS相关发明专利，低轨卫星通信终端天线</li>
          <li>[二级资料] 面向6G的大规模MIMO通信感知一体化: 智能超表面(RIS)被认为是6G关键技术之一</li>
          <li>[学术] Engineering 2026年1月刊: AI与深度学习在太赫兹超大规模MIMO系统中的应用</li>
        </ol>
      </footer>
    </div>
  )
}
