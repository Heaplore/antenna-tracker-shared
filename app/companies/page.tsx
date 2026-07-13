'use client'

import { useState, useEffect } from 'react'
import companiesData from '@/app/_data/companies.json'
import PageHeader from '@/components/PageHeader'

type TierKey = 'tier1_operators' | 'tier2_equipment_vendors' | 'tier3_antenna_oems' | 'tier4_antenna_parts' | 'tier5_rf_parts' | 'tier6_key_materials' | 'tier7_raw_materials'

const TIER_CONFIG: { key: TierKey; label: string; icon: string; color: string; shortLabel: string }[] = [
  { key: 'tier1_operators', label: '运营商', icon: '📡', color: '#1a73e8', shortLabel: '运营商层' },
  { key: 'tier2_equipment_vendors', label: '主设备商（系统集成）', icon: '🏭', color: '#7b1fa2', shortLabel: '主设备商层' },
  { key: 'tier3_antenna_oems', label: '天线整机厂商', icon: '📶', color: '#0288d1', shortLabel: '天线整机层' },
  { key: 'tier4_antenna_parts', label: '天线部件供应商', icon: '🔧', color: '#00796b', shortLabel: '部件层' },
  { key: 'tier5_rf_parts', label: '射频部件供应商', icon: '📻', color: '#e65100', shortLabel: '射频层' },
  { key: 'tier6_key_materials', label: '关键材料供应商', icon: '🧱', color: '#5d4037', shortLabel: '材料层' },
  { key: 'tier7_raw_materials', label: '原材料商', icon: '🥇', color: '#37474f', shortLabel: '原材料层' },
]

interface Company {
  id: string
  name: string
  nameEn: string
  stockCode: string
  exchange: string
  role: string
  position: string
  marketCap?: string
  revenue?: string
  netProfit?: string
  profitYoY?: string
  customers?: string[]
  highlights: string[]
  location: string
  isKey?: boolean
  stockPrices?: number[]
  stockCurrent?: number
  stock52Low?: number
  stock52High?: number
  region?: string
}

interface Instrument {
  name: string
  exchange: string
  contract?: string
  unit: string
  description: string
}

// Region config for operators
const REGION_CONFIG = [
  { key: 'CN', label: '🇨🇳 中国', color: '#e53935' },
  { key: 'NA', label: '🌎 北美', color: '#1a73e8' },
  { key: 'APAC', label: '🌏 亚太', color: '#0288d1' },
  { key: 'EMEA', label: '🌍 欧洲/中东/非洲', color: '#7b1fa2' },
  { key: 'LATAM', label: '🌎 拉丁美洲', color: '#00796b' },
  { key: 'GLOBAL', label: '🌐 全球性巨头', color: '#d97706' },
]

export default function CompaniesPage() {
  const [activeTier, setActiveTier] = useState<TierKey>('tier1_operators')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedSubkey, setSelectedSubkey] = useState<string>('all')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const supplyChain = companiesData.supplyChain as Record<TierKey, any>
  const currentTierData = supplyChain[activeTier]

  // 判断公司是否上市（有可显示的股价）
  const isListed = (company: Company): boolean => {
    if (!company.stockCode) return false
    const unlisted = ['未上市', '—', '非上市', '非独立上市（安弗施集团内）', '非上市（私企）', '未上市（华为全资）']
    return !unlisted.includes(company.stockCode) && company.stockPrices != null && company.stockPrices.length > 0
  }

  // 根据最后更新日 + stockPrices 长度反推 X 轴三个锚点日期 (YYYY-MM)
  const buildAxisLabels = (): [string, string, string] => {
    const lastStr = (companiesData as any).lastUpdate as string | undefined
    const lastDate = lastStr ? new Date(lastStr) : new Date()
    const n = (selectedCompany?.stockPrices?.length) || 30
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const offsetDays = (days: number) => {
      const d = new Date(lastDate); d.setDate(d.getDate() - days); return fmt(d)
    }
    // 30 个交易日 ≈ 42 日历日, 1.4 倍
    const total = Math.round(n * 1.4)
    const half = Math.round(total / 2)
    return [offsetDays(total), offsetDays(half), fmt(lastDate)]
  }

  // Sparkline points (for card mini chart)
  const buildSparklinePoints = (prices: number[], width = 80, height = 22): string => {
    if (!prices || prices.length < 2) return ''
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const margin = range * 0.1
    const yMin = min - margin
    const yMax = max + margin
    const span = yMax - yMin || 1
    return prices.map((p, i, arr) => {
      const x = (i / (arr.length - 1)) * width
      const y = height - ((p - yMin) / span) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }

  // 当日涨跌幅: (今日 - 昨日) / 昨日 × 100%
  const calcDayChange = (prices: number[]): number => {
    if (!prices || prices.length < 2) return 0
    const last = prices[prices.length - 1]
    const prev = prices[prices.length - 2]
    if (prev === 0) return 0
    return ((last - prev) / prev) * 100
  }

  // 获取当前层的所有公司（按rank排序）
  const getCompanies = (): Company[] => {
    const tier = currentTierData
    const companies = tier.companies || []
    return [...companies].sort((a, b) => (a.rank || 99) - (b.rank || 99))
  }

  // 按区域分组（仅运营商层）
  const getRegionalGroups = (): { region: string; label: string; color: string; companies: Company[] }[] => {
    if (activeTier !== 'tier1_operators') return []
    
    const companies = getCompanies()
    const groups: Record<string, Company[]> = {}
    
    // 确定每个公司的区域
    companies.forEach(c => {
      let region = 'GLOBAL' // 默认
      const loc = (c.location || '').toLowerCase()
      const name = (c.name || '').toLowerCase()
      
      if (c.region) {
        region = c.region
      } else if (loc.includes('中国') || loc.includes('北京') || loc.includes('上海') || loc.includes('深圳')) {
        region = 'CN'
      } else if (loc.includes('美国') || loc.includes('达拉斯') || loc.includes('纽约') || loc.includes('贝尔维尤') || loc.includes('费城') || 
                 loc.includes('加拿大') || loc.includes('蒙特利尔') || loc.includes('多伦多') || loc.includes('温哥华')) {
        region = 'NA'
      } else if (loc.includes('日本') || loc.includes('东京') || loc.includes('韩国') || loc.includes('首尔') || 
                 loc.includes('印度') || loc.includes('孟买') || loc.includes('新德里') || loc.includes('新加坡') || 
                 loc.includes('澳大利亚') || loc.includes('墨尔本') || loc.includes('台湾') || loc.includes('台北') ||
                 loc.includes('KDDI') || loc.includes('LG U+') || loc.includes('Airtel') || loc.includes('Telstra') || loc.includes('中华')) {
        region = 'APAC'
      } else if (loc.includes('欧洲') || loc.includes('英国') || loc.includes('伦敦') || loc.includes('斯温登') || 
                 loc.includes('德国') || loc.includes('波恩') || loc.includes('法国') || loc.includes('巴黎') || 
                 loc.includes('西班牙') || loc.includes('马德里') || loc.includes('意大利') || loc.includes('都灵') || 
                 loc.includes('瑞典') || loc.includes('荷兰') || loc.includes('瑞士') || loc.includes('安曼') || 
                 loc.includes('沙特') || loc.includes('利雅得') || loc.includes('阿联酋') || loc.includes('阿布扎比') || 
                 loc.includes('卡塔尔') || loc.includes('多哈') || loc.includes('南非') || loc.includes('约翰内斯堡') || 
                 loc.includes('肯尼亚') || loc.includes('内罗毕') || loc.includes('BT') || loc.includes('TIM') || 
                 loc.includes('Telia') || loc.includes('VEON') || loc.includes('Orange') || loc.includes('Telefónica') || 
                 loc.includes('stc') || loc.includes('Etisalat') || loc.includes('Ooredoo') || loc.includes('Zain') || 
                 loc.includes('MTN') || loc.includes('Vodacom') || loc.includes('Safaricom')) {
        region = 'EMEA'
      } else if (loc.includes('拉美') || loc.includes('墨西哥') || loc.includes('墨西哥城') || loc.includes('巴西') || 
                 loc.includes('圣保罗') || loc.includes('智利') || loc.includes('阿根廷') || loc.includes('秘鲁') || 
                 loc.includes('América') || loc.includes('TIM Brasil') || loc.includes('Millicom')) {
        region = 'LATAM'
      }
      
      if (!groups[region]) groups[region] = []
      groups[region].push(c)
    })
    
    // 按区域配置排序
    const result: { region: string; label: string; color: string; companies: Company[] }[] = []
    REGION_CONFIG.forEach(rc => {
      if (groups[rc.key] && groups[rc.key].length > 0) {
        result.push({
          region: rc.key,
          label: rc.label,
          color: rc.color,
          companies: groups[rc.key]
        })
      }
    })
    
    return result
  }

  const openDetail = (company: Company) => setSelectedCompany(company)
  const closeDetail = () => setSelectedCompany(null)

  // 渲染股票代码标签
  const renderStockBadge = (stockCode: string) => {
    if (!stockCode || stockCode === '未上市' || stockCode === '—') {
      return <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>未上市</span>
    }
    return stockCode.split('/').map((code, i) => (
      <span key={i} style={{
        fontSize: '0.7rem', background: '#e8f0fe', color: '#1967d2',
        padding: '2px 6px', borderRadius: '4px', marginLeft: i > 0 ? '4px' : 0,
        fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap',
      }}>{code.trim()}</span>
    ))
  }

  const renderCompanyCard = (company: Company) => (
    <div
      key={company.id}
      onClick={() => openDetail(company)}
      onMouseEnter={() => setHoveredCard(company.id)}
      onMouseLeave={() => setHoveredCard(null)}
      style={{
        background: hoveredCard === company.id ? '#f8f9ff' : 'white',
        borderRadius: '8px',
        padding: '16px',
        border: `1px solid ${hoveredCard === company.id ? '#667eea' : '#e0e0e0'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: hoveredCard === company.id ? '0 2px 8px rgba(102,126,234,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#333' }}>{company.name}</span>
            {company.isKey && <span style={{ fontSize: '0.9rem' }}>⭐</span>}
          </div>
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>{renderStockBadge(company.stockCode)}</div>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#999', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{company.location}</span>
      </div>
      <p style={{ fontSize: '0.82rem', color: '#667eea', marginBottom: '6px' }}>{company.role}</p>
      <p style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{company.position}</p>
      {company.highlights.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {company.highlights.slice(0, 3).map((tag, i) => (
            <span key={i} style={{ fontSize: '0.72rem', background: '#eef2ff', color: '#667eea', padding: '2px 8px', borderRadius: '10px' }}>{tag}</span>
          ))}
        </div>
      )}
      {isListed(company) && company.stockCurrent != null && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e8e8e8', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(() => {
            const pts = buildSparklinePoints(company.stockPrices || [])
            const chg = calcDayChange(company.stockPrices || [])
            const isUp = chg >= 0
            const color = isUp ? '#e53935' : '#43a047'  // A股/港股习惯: 红涨绿跌
            return (
              <>
                <svg viewBox="0 0 80 22" style={{ width: '80px', height: '22px', flexShrink: 0 }} preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>
                  {company.stockCurrent.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color }}>
                  {isUp ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                </span>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )

  const renderSubkeySection = (subkey: string) => {
    const section = currentTierData.subsections?.[subkey]
    if (!section) return null
    return (
      <div key={subkey} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: TIER_CONFIG.find(t => t.key === activeTier)?.color, display: 'inline-block' }}></span>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', margin: 0 }}>{section.name}</h3>
          <span style={{ fontSize: '0.78rem', color: '#999', marginLeft: '4px' }}>— {section.description}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {section.companies?.map((c: Company) => renderCompanyCard(c))}
        </div>
      </div>
    )
  }

  // 渲染运营商区域分组视图
  const renderRegionalView = () => {
    const groups = getRegionalGroups()
    if (groups.length === 0) return null
    
    // 过滤逻辑
    const filteredGroups = selectedRegion === 'all' 
      ? groups 
      : groups.filter(g => g.region === selectedRegion)
    
    return (
      <div>
        {/* 区域筛选按钮 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedRegion('all')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #e0e0e0',
              background: selectedRegion === 'all' ? '#1a73e8' : '#f5f5f5',
              color: selectedRegion === 'all' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            全部 ({groups.reduce((sum, g) => sum + g.companies.length, 0)}家)
          </button>
          {groups.map(g => (
            <button
              key={g.region}
              onClick={() => setSelectedRegion(g.region)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${selectedRegion === g.region ? g.color : '#e0e0e0'}`,
                background: selectedRegion === g.region ? g.color : '#f5f5f5',
                color: selectedRegion === g.region ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {g.label} ({g.companies.length}家)
            </button>
          ))}
        </div>

        {/* 按区域分组展示 */}
        {filteredGroups.map(group => (
          <div key={group.region} style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${group.color}` }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: group.color }}>{group.label}</span>
              <span style={{ fontSize: '0.8rem', color: '#999' }}>{group.companies.length} 家运营商</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {group.companies.map(c => renderCompanyCard(c))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <PageHeader
        title="🏢 企业图谱"
        subtitle="天线产业链 7 层结构 — 从运营商到原材料，全链条企业追踪与供应链关系分析"
        updateInfo={`数据更新：${(companiesData as any).lastUpdate} · 数据来源：web_search 公开信息`}
      />

      {/* 7层供应链Tab */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px' }}>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TIER_CONFIG.map(tier => (
              <button
                key={tier.key}
                onClick={() => { setActiveTier(tier.key); setSelectedSubkey('all'); setSelectedRegion('all') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeTier === tier.key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeTier === tier.key ? { background: tier.color } : {}}
              >
                <span>{tier.icon}</span>
                <span>{tier.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 层描述 */}
        <div className={`rounded-xl p-4 border mb-5`} style={{ borderColor: TIER_CONFIG.find(t => t.key === activeTier)?.color + '40', background: TIER_CONFIG.find(t => t.key === activeTier)?.color + '08' }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: TIER_CONFIG.find(t => t.key === activeTier)?.color, fontWeight: 700, fontSize: '1rem' }}>
              {TIER_CONFIG.find(t => t.key === activeTier)?.icon} {currentTierData.name}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{currentTierData.description}</p>
        </div>

        {/* tier1_operators 特殊渲染：按区域分组 */}
        {activeTier === 'tier1_operators' ? (
          renderRegionalView()
        ) : (
          /* tier7 特殊渲染：期货品种 */
          activeTier === 'tier7_raw_materials' ? (
            <div>
              {Object.entries(currentTierData.subsections || {}).map(([subkey, section]: [string, any]) => (
                <div key={subkey} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#37474f' }}></span>
                    <h3 className="text-sm font-semibold text-gray-700">{section.name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.instruments?.map((inst: Instrument, i: number) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm">{inst.name}</h4>
                          {inst.contract && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{inst.contract}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{inst.exchange}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{inst.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* tier3 特殊渲染：按细分行业子Tab */
            activeTier === 'tier3_antenna_oems' ? (() => {
              const subsections = currentTierData.subsections || {}
              const subkeys = Object.keys(subsections)
              const activeSubkey = selectedSubkey === 'all' ? subkeys[0] : selectedSubkey
              const activeSection = subsections[activeSubkey]
              const allCompanies = subkeys.flatMap(sk => (subsections[sk]?.companies || []))
              
              return (
                <div>
                  {/* 细分行业子Tab */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedSubkey('all')}
                      style={{
                        padding: '6px 16px', borderRadius: '20px',
                        border: selectedSubkey === 'all' ? `2px solid ${TIER_CONFIG.find(t => t.key === activeTier)?.color}` : '1px solid #e0e0e0',
                        background: selectedSubkey === 'all' ? `${TIER_CONFIG.find(t => t.key === activeTier)?.color}15` : '#f5f5f5',
                        color: selectedSubkey === 'all' ? TIER_CONFIG.find(t => t.key === activeTier)?.color : '#666',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      全部 ({allCompanies.length}家)
                    </button>
                    {subkeys.map(sk => {
                      const section = subsections[sk]
                      const isActive = selectedSubkey === sk
                      return (
                        <button
                          key={sk}
                          onClick={() => setSelectedSubkey(sk)}
                          style={{
                            padding: '6px 16px', borderRadius: '20px',
                            border: isActive ? `2px solid ${TIER_CONFIG.find(t => t.key === activeTier)?.color}` : '1px solid #e0e0e0',
                            background: isActive ? `${TIER_CONFIG.find(t => t.key === activeTier)?.color}15` : '#f5f5f5',
                            color: isActive ? TIER_CONFIG.find(t => t.key === activeTier)?.color : '#666',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                            transition: 'all 0.2s',
                          }}
                        >
                          {section.name} ({section.companies.length}家)
                        </button>
                      )
                    })}
                  </div>

                  {/* 子Tab内容 */}
                  {selectedSubkey === 'all' ? (
                    <div>
                      {subkeys.map(sk => {
                        const section = subsections[sk]
                        return (
                          <div key={sk} style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${TIER_CONFIG.find(t => t.key === activeTier)?.color}` }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: TIER_CONFIG.find(t => t.key === activeTier)?.color }}>{section.name}</span>
                              <span style={{ fontSize: '0.8rem', color: '#999' }}>{section.description}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                              {(section.companies || []).map((c: Company) => renderCompanyCard(c))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${TIER_CONFIG.find(t => t.key === activeTier)?.color}` }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: TIER_CONFIG.find(t => t.key === activeTier)?.color }}>{activeSection.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>{activeSection.description}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                        {(activeSection.companies || []).map((c: Company) => renderCompanyCard(c))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })() : (
          )
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              {/* 顶部：企业名称 + 角色定位/所在地 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                    {renderStockBadge(selectedCompany.stockCode)}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedCompany.nameEn}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{selectedCompany.role}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">📍 {selectedCompany.location}</span>
                  </div>
                </div>
                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 flex-shrink-0">×</button>
              </div>

              {/* 中部：股价走势折线图（仅上市公司显示） */}
              {isListed(selectedCompany) ? (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-blue-600 font-medium">📈 股价走势（近{selectedCompany.stockPrices?.length || 30}个交易日）</span>
                    {selectedCompany.profitYoY && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">净利润同比增长</span>
                        <span className={`text-sm font-bold ${selectedCompany.profitYoY.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                          {selectedCompany.profitYoY}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative" style={{ paddingLeft: '3rem' }}>
                    {/* Y轴标签 */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400" style={{ width: '3rem' }}>
                      <span>{selectedCompany.stock52High ?? 'N/A'}元</span>
                      <span>{(((selectedCompany.stock52High ?? 0) + (selectedCompany.stock52Low ?? 0)) / 2).toFixed(1)}元</span>
                      <span>{selectedCompany.stock52Low ?? 'N/A'}元</span>
                    </div>
                    {/* 图表区 */}
                    <div className="relative h-24">
                      <svg viewBox="0 0 300 96" className="w-full h-full" preserveAspectRatio="none">
                        {/* 动态计算Y轴范围（15%边距） */}
                        {/* 水平网格线 */}
                        <line x1="0" y1="8" x2="300" y2="8" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="48" x2="300" y2="48" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="88" x2="300" y2="88" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                        {/* 价格折线 */}
                        <polyline
                          points={(selectedCompany.stockPrices || []).map((p, i, arr) => { const prices = selectedCompany.stockPrices || []; const min = selectedCompany.stock52Low || Math.min(...prices); const max = selectedCompany.stock52High || Math.max(...prices); const range = max - min || 1; const margin = range * 0.15; const yMin = min - margin; const yMax = max + margin; return `${(i / (arr.length - 1)) * 300},${88 - ((p - yMin) / (yMax - yMin)) * 88}` }).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {/* 最后一个点 */}
                        <circle
                          cx="300"
                          cy={selectedCompany.stockPrices?.length ? (() => { const prices = selectedCompany.stockPrices || []; const min = selectedCompany.stock52Low || Math.min(...prices); const max = selectedCompany.stock52High || Math.max(...prices); const range = max - min || 1; const margin = range * 0.15; const yMin = min - margin; const yMax = max + margin; return 88 - ((prices[prices.length - 1] - yMin) / (yMax - yMin)) * 88 })() : 88}
                          r="3.5"
                          fill="#3b82f6"
                        />
                        <circle
                          cx="300"
                          cy={selectedCompany.stockPrices?.length ? (() => { const prices = selectedCompany.stockPrices || []; const min = selectedCompany.stock52Low || Math.min(...prices); const max = selectedCompany.stock52High || Math.max(...prices); const range = max - min || 1; const margin = range * 0.15; const yMin = min - margin; const yMax = max + margin; return 88 - ((prices[prices.length - 1] - yMin) / (yMax - yMin)) * 88 })() : 88}
                          r="6"
                          fill="#3b82f6"
                          opacity="0.2"
                        />
                      </svg>
                    </div>
                    {/* X轴标签 (动态: 基于 lastUpdate + stockPrices 长度) */}
                    {(() => {
                      const [lbl1, lbl2, lbl3] = buildAxisLabels()
                      return (
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{lbl1}</span>
                          <span>{lbl2}</span>
                          <span>{lbl3}</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                /* 非上市公司：显示净利润同比增长（不显示股价图） */
                selectedCompany.profitYoY ? (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 mr-2">净利润同比增长</span>
                    <span className={`text-sm font-bold ${selectedCompany.profitYoY.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                      {selectedCompany.profitYoY}
                    </span>
                  </div>
                ) : null
              )}

              {/* 关键财务数据 */}
              {selectedCompany.marketCap && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">市值</div>
                    <div className="text-sm font-bold text-gray-800">{selectedCompany.marketCap}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">营收</div>
                    <div className="text-sm font-bold text-gray-800">{selectedCompany.revenue}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">净利润</div>
                    <div className="text-sm font-bold text-gray-800">{selectedCompany.netProfit}</div>
                  </div>
                </div>
              )}

              {/* 企业简介 + 业务亮点并排 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">企业简介</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{selectedCompany.position}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">业务亮点</p>
                  <ul className="space-y-1">
                    {selectedCompany.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 主要客户 */}
              {selectedCompany.customers && selectedCompany.customers.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">主要客户</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCompany.customers.map((c, i) => (
                      <span key={i} className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
