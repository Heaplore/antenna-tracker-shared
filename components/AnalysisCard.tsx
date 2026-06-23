export interface AnalysisCardData {
  type?: string
  severity?: string
  title: string
  summary: string
  details?: string
  recommendation?: string
  data_sources?: string[]
}

const SEVERITY_MAP = { high: "#dc3545", medium: "#fd7e14", low: "#0066cc" }
const TYPE_MAP = { opportunity: "#28a745", risk: "#dc3545", trend: "#6f42c1" }

export default function AnalysisCard({ card }: { card: AnalysisCardData }) {
  const sevColor = SEVERITY_MAP[card.severity as keyof typeof SEVERITY_MAP] || SEVERITY_MAP.low
  const typeColor = card.type ? TYPE_MAP[card.type as keyof typeof TYPE_MAP] : null
  const borderColor = typeColor || sevColor
  const severityLabel = card.severity === "high" ? "高" : card.severity === "medium" ? "中" : "低"
  const typeLabel = card.type === "opportunity" ? "机会" : card.type === "risk" ? "风险" : card.type === "trend" ? "趋势" : severityLabel
  const typeEmoji = card.type === "opportunity" ? "⭐" : card.type === "risk" ? "⚠️" : card.type === "trend" ? "▶️" : "ℹ️"

  return (
    <div style={{ borderLeft: "4px solid " + borderColor, background: borderColor + "08", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span>{typeEmoji}</span>
        <strong style={{ fontSize: "15px" }}>{card.title}</strong>
        <span style={{ fontSize: "11px", padding: "2px 8px", background: borderColor, color: "white", borderRadius: "10px", marginLeft: "auto" }}>{typeLabel}</span>
      </div>
      <p style={{ margin: "0 0 8px 0", fontSize: "14px", lineHeight: "1.6", color: "#333" }}>{card.summary}</p>
      {card.recommendation && (
        <div style={{ fontSize: "13px", color: "#555", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "8px", marginTop: "8px" }}>
          <span style={{ fontWeight: "bold" }}>➔ 建议：</span>{card.recommendation}
        </div>
      )}
      {card.data_sources && card.data_sources.length > 0 && (
        <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>数据来源：{card.data_sources.join("、")}</div>
      )}
    </div>
  )
}