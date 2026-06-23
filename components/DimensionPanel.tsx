import AnalysisCard from "./AnalysisCard"

const DIM_LABELS = {
  technology: { emoji: "⚙️", name: "技术维度", desc: "技术成熟度、路线对比、突破预警" },
  quality: { emoji: "✍️", name: "质量维度", desc: "标准合规、认证风险、质量事件" },
  cost: { emoji: "⛓‍♀️", name: "成本维度", desc: "原材料价格、成本传导、期货信号" },
  delivery: { emoji: "Ⓝ", name: "交付维度", desc: "供应链风险、产能评估、集采动态" },
}

export default function DimensionPanel({ dimension, cards }: {
  dimension: string
  cards: any[]
}) {
  const info = DIM_LABELS[dimension as keyof typeof DIM_LABELS] || { emoji: "⭐", name: dimension, desc: "" }

  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h2 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>{info.emoji} {info.name}</h2>
      <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#888" }}>{info.desc}</p>
      {cards.length === 0 ? (
        <p style={{ color: "#999", fontSize: "14px" }}>暂无分析数据</p>
      ) : (
        cards.map((c, i) => <AnalysisCard key={i} card={c} />)
      )}
    </div>
  )
}