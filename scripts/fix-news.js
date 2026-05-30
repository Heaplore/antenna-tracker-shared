const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'data', 'news.json');
let content = fs.readFileSync(fp, 'utf8');

// Replace Chinese curly quotes inside JSON string values with straight ASCII quotes
// \u201c = "  \u201d = "
content = content.replace(/\u201c/g, '"').replace(/\u201d/g, '"');
content = content.replace(/\u2018/g, "'").replace(/\u2019/g, "'");

try {
  JSON.parse(content);
  fs.writeFileSync(fp, content);
  console.log('OK - news.json is valid JSON');
} catch(e) {
  console.log('Still invalid:', e.message);
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('Around position', pos, ':', JSON.stringify(content.substring(Math.max(0,pos-50), pos+80)));
  }
}