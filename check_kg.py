import json
with open('app/_data/knowledge-graph.json', 'r') as f:
    data = json.load(f)
print('Entities count:', len(data['entities']))
types = {}
for e in data['entities']:
    t = e['type']
    types[t] = types.get(t, 0) + 1
print('By type:', types)
print()
print('Relations count:', len(data['relations']))
rels = {}
for r in data['relations']:
    k = r.get('relation', r.get('predicate', '?'))
    rels[k] = rels.get(k, 0) + 1
print('By relation:', rels)
print()
for e in data['entities'][:5]:
    print(f"  [{e['type']}] {e['name']} - {e.get('description','')[:60]}")
