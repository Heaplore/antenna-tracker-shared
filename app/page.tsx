'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'

export default function HomePage() {
  const chartRefs = useRef<{ market?: HTMLDivElement | null; share?: HTMLDivElement | null; cagr?: HTMLDivElement | null; roadmap?: HTMLDivElement | null }>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="container">
      <PageHeader
        title="📊 全球天线行业市场格局及技术发展现状趋势报告"
        subtitle="从 5G 建设高峰期到 5G-A/6G 过渡期的系统性分析：市场规模、竞争格局、技术演进与未来展望"
        updateInfo="数据更新：2026-07 · 数据来源：web_search 公开信息"
      />

      {/* KPI Strip */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-item" style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a3a8a' }}>641亿</div>
          <div className="stat-label" style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>中国通信天线<br/>2024年市场规模(元)</div>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0891b2' }}>21.0%</div>
          <div className="stat-label" style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>全球 Massive MIMO<br/>AAU 市场 CAGR</div>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b45309' }}>44.2%</div>
          <div className="stat-label" style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>全球 5G 相控阵<br/>天线市场 CAGR</div>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6d28d9' }}>29.4%</div>
          <div className="stat-label" style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>华为国内基站<br/>天线市场份额</div>
        </div>
      </div>

      {/* Section 1: 行业概述 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第一章 行业概述</h2>
        <p style={{ lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
          天线是无线通信系统的核心部件，负责将电信号转换为电磁波（发射）或将电磁波转换为电信号（接收）。随着移动通信从 2G 向 5G-A 和 6G 演进，天线技术经历了从<strong>传统定向/全向天线到大规模 MIMO 有源天线（AAU）</strong>的深刻变革。
        </p>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>1.1 天线产品分类</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>分类维度</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>类型</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={3} style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666', fontStyle: 'italic' }}>（表格略，详见完整版报告）</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: 市场规模 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第二章 市场规模与增长预测</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>2.1 全球天线市场总体规模</h3>
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>细分市场</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>基期规模</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>预测期规模</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>CAGR</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>中国通信天线行业</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>641亿元RMB (2024)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>—</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>2.3% (YoY)</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>全球 5G 天线</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>144亿元RMB (2023)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>142.9亿元RMB (2030)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>-1.3%</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>全球 Massive MIMO AAU</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>16.25亿美元 (2024)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>53.12亿美元 (2031)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>21.0%</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>全球 5G 相控阵天线</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>基数较小</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>5.95亿美元 (2030)</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>44.2%</td></tr>
              <tr><td style={{ padding: '8px 12px' }}>全球 5G 设备整体</td><td style={{ padding: '8px 12px' }}>—</td><td style={{ padding: '8px 12px' }}>+1469.5亿美元 (2028)</td><td style={{ padding: '8px 12px' }}>81.05%</td></tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ background: '#fffbeb', borderLeft: '3px solid #b45309', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem' }}>
          <strong style={{ color: '#b45309' }}>⚠ 关键洞察</strong>
          <p style={{ margin: '4px 0 0', color: '#333', lineHeight: '1.6' }}>全球 5G 天线市场整体趋于饱和（CAGR -1.3%），但<strong>Massive MIMO AAU 升级</strong>和<strong>相控阵天线</strong>呈现高速增长，市场结构性分化明显。</p>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>2.2 区域市场分析</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #e53935' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#333' }}>🇨🇳 中国</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: '1.6' }}>
              <li>全球最大 5G 市场</li>
              <li>5G 连接数超 10 亿</li>
              <li>国产化率超 80%</li>
              <li>5G-A 商用元年</li>
            </ul>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #1a73e8' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#333' }}>🌍 北美</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: '1.6' }}>
              <li>毫米波为主</li>
              <li>运营商 Capex 增长</li>
              <li>Starlink 带动卫星天线</li>
            </ul>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #0288d1' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#333' }}>🇪🇺 欧洲</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: '1.6' }}>
              <li>爱立信/诺基亚</li>
              <li>5G 部署较慢</li>
              <li>Hexa-X 推进 6G</li>
            </ul>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #7b1fa2' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#333' }}>🌏 亚太</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: '1.6' }}>
              <li>印度 BTS 超 45 万</li>
              <li>东南亚/中东加速</li>
              <li>渗透率提升空间大</li>
            </ul>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>2.3 增长驱动因素</h3>
        <div className="drivers-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '📡', text: '5G-A 商用化 — 2024 年"5G-A 商用元年"' },
            { icon: '🛰️', text: '卫星互联网爆发 — Starlink、Kuiper 等 LEO 星座建设' },
            { icon: '🔮', text: '6G 预研投入 — 中国 2025 年将 6G 纳入未来产业' },
            { icon: '🤖', text: 'AI 融合 — AI for network / network for AI 成为 6G 主线' },
            { icon: '📱', text: '物联网扩展 — 海量 IoT 设备催生新型终端天线需求' },
          ].map((d, i) => (
            <div key={i} className="driver-chip" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, #667eea15, #764ba215)', border: '1px solid #667eea30', borderRadius: '24px', fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>
              <span style={{ fontSize: '1.2rem' }}>{d.icon}</span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>

        {/* Chart 1: Market Growth */}
        <div className="chart-panel" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="panel-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#555', marginBottom: '12px', textAlign: 'center' }}>图1：主要天线细分市场增长趋势对比（2023-2031）</div>
          <div ref={el => { chartRefs.current.market = el }} className="chart-container" style={{ minHeight: '340px' }}></div>
        </div>
      </div>

      {/* Section 3: 竞争格局 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第三章 竞争格局分析</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>3.1 全球竞争梯队</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="detail-card" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', borderLeft: '3px solid #1a3a8a' }}>
            <h4 style={{ color: '#1a3a8a', margin: '0 0 12px', fontSize: '1rem', fontWeight: '700' }}>第一梯队 · 全球领导者</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: '1.8' }}>
              <li><strong>华为</strong> — 基站天线份额约 29.4%，5G 核心技术领先</li>
              <li><strong>爱立信</strong> — 瑞典，全球 5G 网络设备主要供应商</li>
              <li><strong>康普/CommScope</strong> — 美国，全球领先无源天线供应商</li>
              <li><strong>诺基亚</strong> — 芬兰，5G 网络设备供应商</li>
            </ul>
          </div>
          <div className="detail-card" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', borderLeft: '3px solid #0891b2' }}>
            <h4 style={{ color: '#0891b2', margin: '0 0 12px', fontSize: '1rem', fontWeight: '700' }}>第二梯队 · 专业天线厂商</h4>
            <ul style={{ padding: '0 0 0 16px', margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: '1.8' }}>
              <li><strong>中兴通讯</strong> — 国内市场份额约 18.6%</li>
              <li><strong>通宇通讯</strong> — 国内 14.2%，全球前五</li>
              <li><strong>京信通信</strong> — 基站天线市场重要参与者</li>
              <li><strong>摩比发展</strong> — 天线及射频组件供应商</li>
            </ul>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>3.2 中国市场格局</h3>
        <div style={{ background: '#e0f2f1', borderLeft: '3px solid #0891b2', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem' }}>
          <strong style={{ color: '#0891b2' }}>✓ 高度集中</strong>
          <p style={{ margin: '4px 0 0', color: '#333', lineHeight: '1.6' }}>2024 年，华为、京信通信、通宇通讯等企业在基站天线市场的合计份额超过 80%。</p>
        </div>

        {/* Chart 2: Market Share Pie */}
        <div className="chart-panel" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="panel-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#555', marginBottom: '12px', textAlign: 'center' }}>图2：中国基站天线市场主要企业份额分布（2024年）</div>
          <div ref={el => { chartRefs.current.share = el }} className="chart-container" style={{ minHeight: '340px' }}></div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>3.3 竞争态势总结</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>趋势</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>影响</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>5G 建设高峰期已过</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>全球 5G 基站部署进入后期，天线市场从增量转向存量替换+升级</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>5G-A 带来新机遇</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>Massive MIMO AAU 升级、通感一体化天线、RIS 等新技术催生新一轮需求</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>卫星天线成新增长极</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>LEO 星座建设带动相控阵天线需求快速增长（CAGR 44.2%）</td></tr>
              <tr><td style={{ padding: '8px 12px', fontWeight: 500 }}>中国企业崛起</td><td style={{ padding: '8px 12px', color: '#666' }}>华为、中兴、通宇通讯等在全球市场份额持续提升</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: 技术发展现状 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第四章 技术发展现状</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>4.1 5G 天线技术现状</h3>
        
        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>Massive MIMO AAU（主流技术）</h4>
        <p style={{ fontSize: '0.85rem', color: '#333', marginBottom: '16px', lineHeight: '1.8' }}>
          <strong>有源天线单元</strong>，集成射频前端与数字波束赋形，支持 64T64R、192T192R 等大规模天线阵列。2024 年市场规模约 16.25 亿美元。
        </p>
        
        <div style={{ borderLeft: '3px solid #0891b2', paddingLeft: '16px', marginBottom: '24px' }}>
          {[
            { year: '演进路径', desc: '4T4R → 64T64R → 192T192R（通道数持续增加）' },
            { year: '频段覆盖', desc: 'Sub-6GHz（n77/n78/n79）+ 毫米波（n257/n258/n261）' },
            { year: 'AI 赋能', desc: '集成 AI 算法实现智能波束管理' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0891b2', marginBottom: '2px' }}>{item.year}</div>
              <p style={{ fontSize: '0.82rem', color: '#666', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>毫米波天线</h4>
        <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '0.85rem', color: '#666', lineHeight: '1.8' }}>
          <li>频段：24-100GHz（FR2）</li>
          <li>特点：大带宽、短距离、穿透损耗大</li>
          <li>部署策略：以热点覆盖为主（场馆、商圈、室内）</li>
        </ul>

        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>相控阵天线（Phased Array）</h4>
        <p style={{ fontSize: '0.85rem', color: '#333', marginBottom: '20px', lineHeight: '1.8' }}>
          <strong>通过控制阵列天线各单元的相位差实现波束扫描</strong>。2024-2030 年 CAGR 达 44.2%。
        </p>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>4.2 5G-A（5.5G）天线技术</h3>
        <p style={{ fontSize: '0.85rem', color: '#333', marginBottom: '12px' }}>2024 年被定义为"5G-A 商用元年"，天线技术关键进展：</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { title: '三载波聚合', desc: '提升频谱效率' },
            { title: '通感一体化（ISAC）', desc: '天线同时支持通信和感知功能' },
            { title: 'RedCap 天线', desc: '面向中等速率 IoT 场景优化' },
            { title: 'XR/裸眼 3D 专网', desc: '面向沉浸式应用优化' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #667eea' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#1a3a8a' }}>{c.title}</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{c.desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>4.3 6G 天线前沿技术</h3>
        
        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>智能超表面（RIS/IRS）</h4>
        <div style={{ background: '#e8f0fe', borderLeft: '3px solid #1a3a8a', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
          <strong style={{ color: '#1a3a8a' }}>💡 核心原理</strong>
          <p style={{ margin: '4px 0 0', color: '#333', lineHeight: '1.6' }}>由大量可编程电磁单元构成的平面结构，通过调控单元参数实现电磁波的反射/透射幅度和相位分布控制。<strong>被认为是 6G 关键技术之一</strong>。</p>
        </div>
        <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '0.85rem', color: '#333', lineHeight: '1.8' }}>
          <li><strong>优势：</strong>低成本、低能耗、易部署</li>
          <li><strong>突破：</strong>清华大学张平武团队提出 STAR-RIS（同时透射和反射），实现 360° 覆盖</li>
          <li><strong>产业化：</strong>中兴 Dynamic RIS 2.0 已发布；中国移动+中兴在杭州亚运会完成全球首个大型赛事 RIS 部署</li>
          <li><strong>标准化：</strong>3GPP Rel-18/19 开始讨论 RIS 相关增强功能</li>
        </ul>

        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>太赫兹天线</h4>
        <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '0.85rem', color: '#666', lineHeight: '1.8' }}>
          <li>频段：>100GHz（0.1-10THz）</li>
          <li>意义：6G 核心频段，提供超大带宽</li>
          <li>进展：华为 220GHz 太赫兹通感一体化原型机实现 240Gbps 传输速率</li>
        </ul>

        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#1a3a8a' }}>空天地一体化天线</h4>
        <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '0.85rem', color: '#666', lineHeight: '1.8' }}>
          <li>卫星直连手机（Direct to Cell）</li>
          <li>低轨卫星（LEO）终端天线（相控阵）</li>
          <li>星地融合 Massive MIMO</li>
        </ul>

        {/* Chart 3: CAGR Bar */}
        <div className="chart-panel" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="panel-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#555', marginBottom: '12px', textAlign: 'center' }}>图3：主要天线细分市场年复合增长率对比</div>
          <div ref={el => { chartRefs.current.cagr = el }} className="chart-container" style={{ minHeight: '260px' }}></div>
        </div>
      </div>

      {/* Section 5: 产业链分析 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第五章 产业链分析</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>5.1 上游：原材料与元器件</h3>
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>环节</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>关键材料/器件</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>主要供应商</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>基板材料</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>PCB/FPC、陶瓷基板</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>深南电路、沪电股份、鹏鼎控股</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>射频芯片</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>PA、LNA、Switch、Filter</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>高通、博通、Skyworks、卓胜微</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>连接器</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>射频连接器</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>罗森伯格、安费诺、意华股份</td></tr>
              <tr><td style={{ padding: '8px 12px' }}>天线振子</td><td style={{ padding: '8px 12px' }}>金属贴片、介质材料</td><td style={{ padding: '8px 12px' }}>通宇通讯、京信通信自产</td></tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>5.2 下游：应用市场</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>应用领域</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>代表客户</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>天线需求特点</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>运营商网络</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>中国移动、Verizon、Vodafone</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>大规模 Massive MIMO AAU</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>卫星互联网</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>SpaceX/Starlink、Amazon/Kuiper</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>相控阵天线</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>终端设备</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>苹果、三星、华为、小米</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>小型化多频终端天线</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>车联网/物联网</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>车企、IoT 设备商</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>低频段、低功耗天线</td></tr>
              <tr><td style={{ padding: '8px 12px' }}>国防军工</td><td style={{ padding: '8px 12px' }}>各国军方</td><td style={{ padding: '8px 12px' }}>高可靠、抗干扰天线</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6: 技术发展路线图 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第六章 技术发展路线图</h2>
        
        {/* Chart 4: Roadmap Gantt */}
        <div className="chart-panel" style={{ background: '#f8f9fb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="panel-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#555', marginBottom: '12px', textAlign: 'center' }}>图4：天线技术发展路线图（2019-2031）</div>
          <div ref={el => { chartRefs.current.roadmap = el }} className="chart-container" style={{ minHeight: '420px' }}></div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>关键时间节点</h3>
        <div style={{ borderLeft: '3px solid #0891b2', paddingLeft: '16px' }}>
          {[
            { year: '2019年', desc: '全球 5G 商用元年，Massive MIMO AAU 开始部署' },
            { year: '2024年', desc: '5G-A 商用元年，3GPP R18 标准冻结' },
            { year: '2025年', desc: '中国将 6G 纳入《政府工作报告》，工信部推进 6G 研发' },
            { year: '2028-2029年', desc: '6G 标准制定关键期' },
            { year: '2030年及以后', desc: '6G 商用部署' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0891b2', marginBottom: '2px' }}>{item.year}</div>
              <p style={{ fontSize: '0.82rem', color: '#666', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: 挑战与风险 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第七章 挑战与风险</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>7.1 技术挑战</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { title: '高频段传播损耗', desc: '毫米波/太赫兹频段穿透损耗大，覆盖半径小' },
            { title: 'RIS 硬件可靠性', desc: 'PIN 管/液晶材料长期运行稳定性待验证' },
            { title: '信道估计复杂度', desc: 'BS-RIS-UE 级联信道估计困难，导频开销大' },
            { title: '功耗与散热', desc: 'Massive MIMO AAU 功耗显著高于传统架构' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', borderLeft: '3px solid #667eea' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#1a3a8a' }}>{c.title}</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{c.desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>7.2 市场与供应链风险</h3>
        <div style={{ background: '#fffbeb', borderLeft: '3px solid #b45309', padding: '12px 16px', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong style={{ color: '#b45309' }}>⚠ 地缘政治风险</strong>
          <p style={{ margin: '4px 0 0', color: '#333', lineHeight: '1.6' }}>华为、中兴在海外市场的受限影响全球份额。高端射频芯片（PA/LNA）仍依赖海外供应商（高通、博通等），自主可控是下一步重点。</p>
        </div>
      </div>

      {/* Section 8: 未来展望 */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: '#0b1222' }}>第八章 未来展望</h2>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>六大趋势判断</h3>
        <ol style={{ padding: '0 0 0 16px', margin: '0 0 20px', fontSize: '0.85rem', color: '#333', lineHeight: '2' }}>
          <li><strong>Massive MIMO 持续演进</strong> — 通道数从 64T64R 向 192T192R 甚至更高演进，AAU 市场 CAGR 21.0%</li>
          <li><strong>RIS 从实验室走向商用</strong> — 预计 2026-2027 年小规模商用，2030 后成为 6G 标配</li>
          <li><strong>卫星天线成新蓝海</strong> — LEO 星座建设驱动相控阵天线市场 CAGR 44.2%</li>
          <li><strong>AI 深度融合</strong> — AI 辅助波束管理、信道估计将成为 5G-A/6G 天线标配能力</li>
          <li><strong>通感一体化</strong> — 天线同时支持通信和感知功能，开辟新应用场景</li>
          <li><strong>国产化替代加速</strong> — 中国天线企业全球份额持续提升</li>
        </ol>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>重点关注企业</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>企业</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>投资逻辑</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>华为</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>5G/5G-A/6G 全栈技术领先，天线自研自产</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>中兴通讯</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>自研自产一体化，Dynamic RIS 2.0 领先</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>通宇通讯</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>全球基站天线前五，受益 5G-A 升级周期</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>信维通信</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>终端天线龙头，拓展卫星/汽车天线</td></tr>
              <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>盛路通信</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#666' }}>689 项 RIS 专利储备，卫星/军工双轮驱动</td></tr>
              <tr><td style={{ padding: '8px 12px', fontWeight: 500 }}>Commscope</td><td style={{ padding: '8px 12px', color: '#666' }}>全球无源天线龙头，受益 5G-A 升级</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 9: 结论 */}
      <div style={{ background: 'linear-gradient(135deg, #0b1222 0%, #152244 35%, #1a3a6a 65%, #0b2744 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#67e8f9', marginBottom: '8px' }}>CHAPTER 09</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px', color: '#fff', borderBottom: 'none' }}>结论</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>全球天线行业正处于<span style={{ color: '#67e8f9', fontWeight: '700' }}>历史性转折点</span>：</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
            <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ position: 'absolute', left: 0, color: '#67e8f9', fontSize: '0.5rem', top: '0.7rem' }}>◆</span>
              <strong>短期（2024-2026）</strong>：5G 建设高峰期已过，但 5G-A 商用化带来 Massive MIMO AAU 升级周期，市场结构性增长
            </li>
            <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ position: 'absolute', left: 0, color: '#67e8f9', fontSize: '0.5rem', top: '0.7rem' }}>◆</span>
              <strong>中期（2026-2028）</strong>：RIS 技术从小规模试点走向商用，卫星相控阵天线需求爆发
            </li>
            <li style={{ padding: '6px 0 6px 20px', position: 'relative', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ position: 'absolute', left: 0, color: '#67e8f9', fontSize: '0.5rem', top: '0.7rem' }}>◆</span>
              <strong>长期（2028-2030+）</strong>：6G 标准制定完成，太赫兹天线、智能超表面、空天地一体化天线成为主流
            </li>
          </ul>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '8px' }}>中国企业在全球天线产业链中的地位持续提升，华为、中兴、通宇通讯等已具备全球竞争力。未来竞争焦点将从"硬件制造"转向"AI+天线"的系统级创新能力。</p>
        </div>
      </div>

    </div>
  )
}
