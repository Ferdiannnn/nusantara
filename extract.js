const fs = require('fs');
const content = fs.readFileSync('public/map.html', 'utf8');
const match = content.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  fs.writeFileSync('temp.js', match[1]);
}
