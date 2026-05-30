const fs = require('fs');
const path = require('path');

const files = ['news.json', 'companies.json', 'technology.json'];
files.forEach(f => {
  const fp = path.join(__dirname, '..', 'data', f);
  if (!fs.existsSync(fp)) return;
  let content = fs.readFileSync(fp, 'utf8');
  // Replace curly quotes with straight quotes
  content = content.replace(/\u201c/g, '\\"').replace(/\u201d/g, '\\"');
  content = content.replace(/\u2018/g, "'").replace(/\u2019/g, "'");
  // Verify it's valid JSON
  try {
    JSON.parse(content);
    fs.writeFileSync(fp, content);
    console.log(`✅ Fixed: ${f}`);
  } catch (e) {
    console.error(`❌ ${f}: ${e.message}`);
    // Find the approximate position
    const m = e.message.match(/position (\d+)/);
    if (m) {
      const pos = parseInt(m[1]);
      console.error('  Context:', content.substring(Math.max(0,pos-50), pos+100));
    }
  }
});