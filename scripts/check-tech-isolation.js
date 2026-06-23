const fs = require('fs');
const kg = JSON.parse(fs.readFileSync('app/_data/knowledge-graph.json', 'utf-8'));
const techIds = new Set(kg.entities.filter(e => e.type === 'technology').map(e => e.id));
const kgRelSources = new Set(kg.relations.map(r => r.source));
const kgRelTargets = new Set(kg.relations.map(r => r.target));
const techInKgRel = [...techIds].filter(t => kgRelSources.has(t) || kgRelTargets.has(t));
console.log('技术实体总数:', techIds.size);
console.log('在 kg.relations 中出现的:', techInKgRel.length);
console.log('孤立的（不在kg.relations中）:', [...techIds].filter(t => !techInKgRel.includes(t)).length);
console.log('\n孤立的技术实体:');
[...techIds].filter(t => !techInKgRel.includes(t)).forEach(t => {
  const entity = kg.entities.find(e => e.id === t);
  console.log(`  ${entity.name} (${t})`);
});
