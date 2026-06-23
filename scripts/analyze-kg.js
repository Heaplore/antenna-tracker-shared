const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'app', '_data');
const kg = JSON.parse(fs.readFileSync(path.join(dataDir, 'knowledge-graph.json'), 'utf-8'));

const techs = kg.entities.filter(e => e.type === 'technology');
console.log('=== 知识图谱统计 ===');
console.log('总实体数:', kg.entities.length);
console.log('技术实体数:', techs.length);
console.log('关系总数:', kg.relations.length);

console.log('\n=== 技术实体详情 ===');
techs.forEach(t => {
  const hasDesc = t.description && t.description.length > 10;
  console.log(`  ${t.name} (${t.id}): ${hasDesc ? '有描述' : '无描述'} - "${t.description ? t.description.substring(0, 60) : '(null)'}..."`);
});

// 检查哪些技术实体有关联关系
const techIds = new Set(techs.map(t => t.id));
const techRelated = kg.relations.filter(r => techIds.has(r.source) || techIds.has(r.target));
console.log('\n=== 有关联的技术关系:', techRelated.length, '===');
techRelated.forEach(r => {
  console.log(`  ${r.source} --[${r.relation}]--> ${r.target}`);
});

// 检查 summary vs description
const techsWithSummary = techs.filter(t => t.summary);
console.log('\n=== 有 summary 字段的技术:', techsWithSummary.length);
techsWithSummary.forEach(t => {
  console.log(`  ${t.name}: summary="${(t.summary || '').substring(0, 80)}..."`);
});
