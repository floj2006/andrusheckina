const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const output = path.join(root, 'dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const photos = [...new Set([...html.matchAll(/src="(photo anna\/[^\"]+)"/g)].map(match => match[1]))];
const files = ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'ICON-LICENSES.txt', ...photos];
for (const file of files) {
  const source = path.resolve(root, file);
  const target = path.resolve(output, file);
  if (!source.startsWith(root + path.sep) || !target.startsWith(output + path.sep)) throw new Error('Invalid asset path');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log('Static build ready: dist (' + files.length + ' files)');
