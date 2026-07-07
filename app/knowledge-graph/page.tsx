'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as d3 from 'd3'
import kgDataRaw from '@/app/_data/knowledge-graph.json'

// ===== 类型定义 =====

type NodeType = 'technology' | 'metric' | 'component' | 'material'

interface KGNode {
  id: string
  name: string
  nameEn: string
  type: NodeType
  filename: string
  tags: string[]
  createdAt: string
  updatedAt: string
  oneLiner: string
  analogy: string
  outgoing: { targetId: string; label: string }[]
}

interface KGLink {
  source: string
  target: string
  type: string
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: NodeType
  oneLiner: string
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode
  target: string | SimNode
}

const kgData = kgDataRaw as {
  lastUpdate: string
  totalNotes: number
  stats: Record<NodeType, number>
  nodes: KGNode[]
  links: KGLink[]
}

// ===== 视觉配置 =====

const TYPE_COLORS: Record<NodeType, string> = {
  technology: '#6366f1',   // 靛蓝
  metric: '#10b981',       // 翠绿
  component: '#f59e0b',    // 琥珀
  material: '#ef4444',     // 朱红
}

const TYPE_LABELS: Record<NodeType, string> = {
  technology: '技术概念',
  metric: '指标术语',
  component: '零部件',
  material: '材料',
}

const TYPE_ICONS: Record<NodeType, string> = {
  technology: '◆',
  metric: '○',
  component: '▣',
  material: '⬡',
}

const NODE_RADIUS = 18

// ===== 页面 =====

export default function KnowledgeGraphPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<NodeType>>(
    new Set<NodeType>(['technology', 'metric', 'component', 'material']),
  )
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 })

  // ===== 过滤后数据 =====

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const nodes = kgData.nodes
      .filter((n) => activeTypes.has(n.type))
      .filter((n) => {
        if (!q) return true
        return (
          n.name.toLowerCase().includes(q) ||
          (n.nameEn && n.nameEn.toLowerCase().includes(q)) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.oneLiner.toLowerCase().includes(q)
        )
      })
    const ids = new Set(nodes.map((n) => n.id))
    const links = kgData.links.filter(
      (l) => ids.has(l.source) && ids.has(l.target),
    )
    return { nodes, links }
  }, [searchQuery, activeTypes])

  // ===== 选中节点 =====
  const selectedNode = useMemo(
    () => kgData.nodes.find((n) => n.id === selectedId) || null,
    [selectedId],
  )

  // ===== 邻居计算 =====
  const neighbors = useMemo(() => {
    if (!selectedId) return { incoming: new Set<string>(), outgoing: new Set<string>() }
    const incoming = new Set<string>()
    const outgoing = new Set<string>()
    for (const l of kgData.links) {
      if (l.source === selectedId) outgoing.add(l.target)
      if (l.target === selectedId) incoming.add(l.source)
    }
    return { incoming, outgoing }
  }, [selectedId])

  // ===== D3 力导向图渲染 =====
  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const rect = container.getBoundingClientRect()
    const W = rect.width || 1200
    const H = rect.height || 800
    setContainerSize({ w: W, h: H })

    // 清理旧图层
    d3.select(svg).selectAll('*').remove()
    const g = d3
      .select(svg)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')

    // zoom/pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })
    zoomRef.current = zoom
    d3.select(svg).call(zoom)

    // 复制数据 (避免 d3 内部改 frozen JSON)
    const nodes: SimNode[] = filtered.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      oneLiner: n.oneLiner,
    }))
    const links: SimLink[] = filtered.links.map((l) => ({
      source: l.source,
      target: l.target,
    }))

    if (nodes.length === 0) return

    // simulation
    const sim = d3
      .forceSimulation<SimNode, SimLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(110)
          .strength(0.6),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force(
        'collide',
        d3.forceCollide<SimNode>().radius(NODE_RADIUS + 6),
      )
      .alpha(1)
      .alphaDecay(0.025)
    simulationRef.current = sim

    // 连线 (箭头)
    const defs = d3.select(svg).append('defs')
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#cbd5e1')

    const linkSel = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', 'url(#arrow)')

    // 节点组 (圆 + 文字)
    const nodeSel = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedId(d.id))
      .on('mouseover', (_, d) => setHoveredId(d.id))
      .on('mouseout', () => setHoveredId(null))
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any,
      )

    nodeSel
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => TYPE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    nodeSel
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 14)
      .attr('font-weight', 700)
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d) => TYPE_ICONS[d.type])

    nodeSel
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', NODE_RADIUS + 16)
      .attr('font-size', 11)
      .attr('fill', '#1f2937')
      .attr('pointer-events', 'none')
      .text((d) => (d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name))

    // 选中节点高亮
    function updateHighlight() {
      const sel = selectedId
      const hov = hoveredId
      const focusId = sel || hov
      if (!focusId) {
        nodeSel.attr('opacity', 1)
        linkSel.attr('opacity', 0.5)
        return
      }
      const neighborSet = new Set<string>([focusId])
      for (const l of links) {
        const s = typeof l.source === 'string' ? l.source : (l.source as SimNode).id
        const t = typeof l.target === 'string' ? l.target : (l.target as SimNode).id
        if (s === focusId) neighborSet.add(t)
        if (t === focusId) neighborSet.add(s)
      }
      nodeSel.attr('opacity', (d) => (neighborSet.has(d.id) ? 1 : 0.2))
      linkSel
        .attr('opacity', (l: any) => {
          const s = typeof l.source === 'string' ? l.source : l.source.id
          const t = typeof l.target === 'string' ? l.target : l.target.id
          return s === focusId || t === focusId ? 0.9 : 0.05
        })
        .attr('stroke', (l: any) => {
          const s = typeof l.source === 'string' ? l.source : l.source.id
          const t = typeof l.target === 'string' ? l.target : l.target.id
          return s === focusId || t === focusId ? '#6366f1' : '#cbd5e1'
        })
        .attr('stroke-width', (l: any) => {
          const s = typeof l.source === 'string' ? l.source : l.source.id
          const t = typeof l.target === 'string' ? l.target : l.target.id
          return s === focusId || t === focusId ? 2 : 1
        })
    }
    updateHighlight()

    // tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', (d: any) => (typeof d.source === 'object' ? d.source.x : 0))
        .attr('y1', (d: any) => (typeof d.source === 'object' ? d.source.y : 0))
        .attr('x2', (d: any) => (typeof d.target === 'object' ? d.target.x : 0))
        .attr('y2', (d: any) => (typeof d.target === 'object' ? d.target.y : 0))
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    // 上一次 highlight 同步
    const id = setInterval(updateHighlight, 60)
    return () => {
      clearInterval(id)
      sim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  // ===== 选中/hover 联动 =====
  useEffect(() => {
    // 触发一次重绘更新 highlight
    const svg = svgRef.current
    if (!svg) return
    const sel = d3.select(svg).selectAll<SVGGElement, SimNode>('g.node')
    const lnk = d3.select(svg).selectAll<SVGLineElement, SimLink>('line')
    const sel_id = selectedId
    const hov = hoveredId
    const focus = sel_id || hov
    if (!focus) {
      sel.attr('opacity', 1)
      lnk.attr('opacity', 0.5)
      return
    }
    const neighborSet = new Set([focus])
    kgData.links.forEach((l) => {
      if (l.source === focus) neighborSet.add(l.target)
      if (l.target === focus) neighborSet.add(l.source)
    })
    sel.attr('opacity', (d: any) => (neighborSet.has(d.id) ? 1 : 0.2))
    lnk
      .attr('opacity', (l: any) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source
        const t = typeof l.target === 'object' ? l.target.id : l.target
        return s === focus || t === focus ? 0.9 : 0.05
      })
      .attr('stroke', (l: any) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source
        const t = typeof l.target === 'object' ? l.target.id : l.target
        return s === focus || t === focus ? '#6366f1' : '#cbd5e1'
      })
      .attr('stroke-width', (l: any) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source
        const t = typeof l.target === 'object' ? l.target.id : l.target
        return s === focus || t === focus ? 2 : 1
      })
  }, [selectedId, hoveredId])

  // ===== 容器尺寸响应 =====
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        setContainerSize({ w: r.width, h: r.height })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // ===== 抽屉关闭 ESC =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ===== iframe 内部关联笔记跳转 → 在 modal 内换内容 + 顶部节点名同步 =====
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data: any = (e as any).data
      if (!data || data.type !== 'kg-nav') return
      const id = typeof data.id === 'string' ? data.id : ''
      if (!id) return
      // 验证 id 真实存在（避免跳转孤儿/空 KG 节点）
      const exists = kgData.nodes.some((n) => n.id === id)
      if (!exists) return
      setSelectedId(id)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const toggleType = (t: NodeType) => {
    const next = new Set(activeTypes)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    if (next.size === 0) return // 至少保留 1 类
    setActiveTypes(next)
  }

  const fitView = () => {
    const svg = svgRef.current
    const zoom = zoomRef.current
    if (!svg || !zoom) return
    d3.select(svg).transition().duration(500).call(zoom.transform, d3.zoomIdentity)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      {/* ===== 顶部工具栏 ===== */}
      <header
        style={{
          padding: '12px 20px',
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
            天线知识图谱
          </h1>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {filtered.nodes.length} 节点 / {filtered.links.length} 关系 · 更新于 {kgData.lastUpdate}
          </span>
        </div>
        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索节点 (名称 / 标签 / 内容)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
          }}
        />
        {/* 类型筛选 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.keys(TYPE_LABELS) as NodeType[]).map((t) => {
            const on = activeTypes.has(t)
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  border: `1px solid ${on ? TYPE_COLORS[t] : '#e5e7eb'}`,
                  background: on ? TYPE_COLORS[t] : '#fff',
                  color: on ? '#fff' : '#6b7280',
                  borderRadius: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{TYPE_ICONS[t]}</span>
                {TYPE_LABELS[t]}({kgData.stats[t]})
              </button>
            )
          })}
          <button
            onClick={fitView}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#374151',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            ↺ 复位
          </button>
        </div>
      </header>

      {/* ===== 图谱区 ===== */}
      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      >
        <svg
          ref={svgRef}
          width={containerSize.w}
          height={containerSize.h}
          style={{ display: 'block', background: '#fff' }}
        />

        {/* 图例 */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 11,
            color: '#4b5563',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>图例</div>
          {(Object.keys(TYPE_LABELS) as NodeType[]).map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: TYPE_COLORS[t],
                }}
              />
              <span>{TYPE_LABELS[t]}</span>
              <span style={{ color: '#9ca3af' }}>·</span>
              <span style={{ color: '#9ca3af' }}>{kgData.stats[t]} 节点</span>
            </div>
          ))}
        </div>

        {/* 提示 */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.85)',
            padding: '6px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 11,
            color: '#6b7280',
            pointerEvents: 'none',
          }}
        >
          点击节点查看详情 · 拖动节点调整位置 · 滚轮缩放
        </div>
      </div>

      {/* ===== 节点详情弹窗（居中） ===== */}
      {selectedNode && (
        <Modal
          node={selectedNode}
          inNeighborIds={neighbors.incoming}
          outNeighborIds={neighbors.outgoing}
          onClose={() => setSelectedId(null)}
          onNodeClick={(id) => setSelectedId(id)}
        />
      )}
    </div>
  )
}

// ===== 居中弹窗 =====

function Modal({
  node,
  inNeighborIds,
  outNeighborIds,
  onClose,
  onNodeClick,
}: {
  node: KGNode
  inNeighborIds: Set<string>
  outNeighborIds: Set<string>
  onClose: () => void
  onNodeClick: (id: string) => void
}) {
  const allNodesById = useMemo(() => {
    const m = new Map<string, KGNode>()
    for (const n of kgData.nodes) m.set(n.id, n)
    return m
  }, [])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 72,
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 32px 100px rgba(0,0,0,0.3)',
            width: 'min(1360px, 96vw)',
            height: 'min(900px, calc(100vh - 88px))',
            maxWidth: 'none',
            maxHeight: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleIn 0.2s ease-out',
          }}
        >
          {/* 顶部栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              borderBottom: `2px solid ${TYPE_COLORS[node.type]}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  fontSize: 12,
                  background: TYPE_COLORS[node.type],
                  color: '#fff',
                  borderRadius: 10,
                }}
              >
                {TYPE_ICONS[node.type]} {TYPE_LABELS[node.type]}
              </span>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
                {node.name}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* ===== 主体：左 iframe + 右 关联笔记 ===== */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* 左：HTML 卡片 iframe */}
            <iframe
              key={node.id}
              src={`/antenna-tracker/kg-cards-rendered/${encodeURIComponent(node.id)}.html`}
              title={`${node.name} 科普卡片`}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation"
            />

            {/* 右：关联笔记侧栏（实时取自 KG 图谱数据，非 iframe 内的 top-3） */}
            <RelatedNotesPanel
              outgoingIds={Array.from(outNeighborIds)}
              incomingIds={Array.from(inNeighborIds)}
              onNodeClick={onNodeClick}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ===== 关联笔记侧栏 =====

function RelatedNotesPanel({
  outgoingIds,
  incomingIds,
  onNodeClick,
}: {
  outgoingIds: string[]
  incomingIds: string[]
  onNodeClick: (id: string) => void
}) {
  const nodesById = useMemo(() => {
    const m = new Map<string, KGNode>()
    for (const n of kgData.nodes) m.set(n.id, n)
    return m
  }, [])

  const [showAllOut, setShowAllOut] = useState(false)
  const [showAllIn, setShowAllIn] = useState(false)

  const outgoing = useMemo(
    () => outgoingIds.map((id) => nodesById.get(id)).filter(Boolean) as KGNode[],
    [outgoingIds, nodesById],
  )
  const incoming = useMemo(
    () => incomingIds.map((id) => nodesById.get(id)).filter(Boolean) as KGNode[],
    [incomingIds, nodesById],
  )
  const total = outgoing.length + incoming.length

  if (total === 0) {
    return (
      <aside
        style={{
          width: 320,
          flexShrink: 0,
          borderLeft: '1px solid #e5e7eb',
          background: '#f9fafb',
          padding: 20,
          fontSize: 13,
          color: '#9ca3af',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        📚 关联笔记
        <div style={{ marginTop: 12, fontSize: 12 }}>暂无关联</div>
      </aside>
    )
  }

  const renderList = (list: KGNode[], expanded: boolean, toggle: () => void) => {
    const visible = expanded ? list : list.slice(0, 9)
    const hidden = list.length - visible.length
    return (
      <>
        {visible.map((n) => (
          <button
            key={n.id}
            onClick={() => onNodeClick(n.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              marginBottom: 4,
              background: '#fff',
              border: `1px solid ${TYPE_COLORS[n.type]}33`,
              borderLeft: `3px solid ${TYPE_COLORS[n.type]}`,
              borderRadius: 6,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${TYPE_COLORS[n.type]}11`
              e.currentTarget.style.transform = 'translateX(2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
            title={n.nameEn || n.name}
          >
            <span
              style={{
                color: TYPE_COLORS[n.type],
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {TYPE_ICONS[n.type]}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: '#374151',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {n.name}
            </span>
          </button>
        ))}
        {hidden > 0 && (
          <button
            onClick={toggle}
            style={{
              width: '100%',
              padding: '6px',
              marginTop: 4,
              background: 'transparent',
              border: '1px dashed #d1d5db',
              borderRadius: 6,
              color: '#6b7280',
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            ▼ 展开剩余 {hidden} 条
          </button>
        )}
        {expanded && list.length > 9 && (
          <button
            onClick={toggle}
            style={{
              width: '100%',
              padding: '6px',
              marginTop: 4,
              background: 'transparent',
              border: '1px dashed #d1d5db',
              borderRadius: 6,
              color: '#6b7280',
              fontSize: 11.5,
              cursor: 'pointer',
            }}
          >
            ▲ 收起
          </button>
        )}
      </>
    )
  }

  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid #e5e7eb',
        background: '#f9fafb',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          📚 关联笔记 <span style={{ color: '#6b7280', fontWeight: 400 }}>({total})</span>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
          实时取自 KG 图谱，非卡片内置 top-3
        </div>
      </div>

      {outgoing.length > 0 && (
        <section style={{ padding: '12px 12px 4px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
              padding: '0 4px',
            }}
          >
            ➤ 出向关联（此节点依赖 / 引用） · {outgoing.length}
          </div>
          {renderList(outgoing, showAllOut, () => setShowAllOut(!showAllOut))}
        </section>
      )}

      {incoming.length > 0 && (
        <section style={{ padding: '8px 12px 16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
              padding: '0 4px',
            }}
          >
            ← 入向关联（被此节点引用） · {incoming.length}
          </div>
          {renderList(incoming, showAllIn, () => setShowAllIn(!showAllIn))}
        </section>
      )}
    </aside>
  )
}
