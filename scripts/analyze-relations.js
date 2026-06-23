const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'app', '_data');
const relations = JSON.parse(fs.readFileSync(path.join(dataDir, 'relations.json'), 'utf-8'));
const kg = JSON.parse(fs.readFileSync(path.join(dataDir, 'knowledge-graph.json'), 'utf-8'));

console.log('=== relations.json 分析 ===');
console.log('总条目数:', relations.length);

const techOnly = relations.filter(r => r.source.startsWith('tech_') && r.target.startsWith('tech_'));
const crossType = relations.filter(r => !(r.source.startsWith('tech_') && r.target.startsWith('tech_')));
console.log('技术-技术关系:', techOnly.length);
console.log('跨类型关系:', crossType.length);

if (crossType.length > 0) {
  console.log('\n=== 跨类型关系示例 ===');
  crossType.slice(0, 15).forEach(r => {
    console.log(`  ${r.source} --[${r.predicate}]--> ${r.target}`);
  });
}

// 检查 knowledge-graph.json 的 relations 数组
console.log('\n=== knowledge-graph.json relations 分析 ===');
console.log('总关系数:', kg.relations.length);
const kgCrossType = kg.relations.filter(r => !r.source.startsWith('tech_') || !r.target.startsWith('tech_'));
console.log('非技术-技术关系:', kgCrossType.length);
if (kgCrossType.length > 0) {
  console.log('\n示例:');
  kgCrossType.slice(0, 10).forEach(r => {
    console.log(`  ${r.source} --[${r.relation}]--> ${r.target}`);
  });
}

// 检查哪些实体类型出现在跨类型关系中
const targetTypes = {};
crossType.forEach(r => {
  const t = r.target.split('_')[0];
  targetTypes[t] = (targetTypes[t] || 0) + 1;
});
console.log('\n=== 技术实体关联的目标类型分布 ===');
Object.entries(targetTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} 条`);
});
