const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'app', '_data');
const kg = JSON.parse(fs.readFileSync(path.join(dataDir, 'knowledge-graph.json'), 'utf-8'));

const techs = kg.entities.filter(e => e.type === 'technology');
console.log('=== 技术实体字段完整性检查 ===');
techs.forEach(t => {
  console.log(`\n--- ${t.name} ---`);
  console.log('  description:', t.description ? `"${t.description.substring(0, 80)}..."` : '(null)');
  console.log('  summary:', t.summary ? `"${t.summary.substring(0, 80)}..."` : '(null)');
  console.log('  summary_vernacular:', t.summary_vernacular ? `"${t.summary_vernacular.substring(0, 80)}..."` : '(null)');
});
