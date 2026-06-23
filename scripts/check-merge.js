const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'app', '_data');
const kg = JSON.parse(fs.readFileSync(path.join(dataDir, 'knowledge-graph.json'), 'utf-8'));
const relations = JSON.parse(fs.readFileSync(path.join(dataDir, 'relations.json'), 'utf-8'));

// 模拟前端的合并逻辑
const allRelations = [
  ...kg.relations,
  ...relations.map(r => ({ source: r.source, target: r.target, predicate: r.predicate, relation: r.predicate }))
];

const filteredEntityIds = new Set(kg.entities.map(e => e.id));
const mergedFiltered = allRelations.filter(r => filteredEntityIds.has(r.source) && filteredEntityIds.has(r.target));

console.log('=== 合并后的关系统计 ===');
console.log('kg.relations 数量:', kg.relations.length);
console.log('relations.json 数量:', relations.length);
console.log('合并后总数:', allRelations.length);
console.log('过滤后(两端都在entities中):', mergedFiltered.length);

// 检查 relations.json 的关系是否被过滤掉了
const techRelInMerged = mergedFiltered.filter(r => r.source.startsWith('tech_'));
console.log('\n合并后技术相关关系:', techRelInMerged.length);
console.log('relations.json 的技术关系数:', relations.length);

// 检查 relations.json 的关系是否因为 target/source 不在 kg.entities 中被过滤
const techRelNotMatched = relations.filter(r => !filteredEntityIds.has(r.source) || !filteredEntityIds.has(r.target));
console.log('\nrelations.json 中未被匹配的关系:', techRelNotMatched.length);
if (techRelNotMatched.length > 0) {
  console.log('未匹配示例:');
  techRelNotMatched.slice(0, 5).forEach(r => {
    const sourceExists = filteredEntityIds.has(r.source);
    const targetExists = filteredEntityIds.has(r.target);
    console.log(`  ${r.source}(${sourceExists?'✓':'✗'}) --[${r.predicate}]--> ${r.target}(${targetExists?'✓':'✗'})`);
  });
}
