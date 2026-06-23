export default function CrossAnalysisSummary({ text, timestamp }: {
  text: string
  timestamp?: string
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>⭐ 综合分析结论</h2>
      <p style={{ margin: "0 0 8px 0", fontSize: "14px", lineHeight: "1.8", opacity: 0.95, whiteSpace: "pre-wrap" }}>
        {text}
      </p>
      {timestamp && (
        <p style={{ margin: "0", fontSize: "12px", opacity: 0.7 }}>
          分析生成时间：{timestamp}
        </p>
      )}
    </div>
  )
}