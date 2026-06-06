const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend/src/components/editor/PublicShareView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-\[#0a0a0f\]/g, 'bg-canvas');
content = content.replace(/bg-\[#13131a\]/g, 'bg-surface-soft');
content = content.replace(/border-white\/10/g, 'border-hairline-soft');
content = content.replace(/text-white/g, 'text-ink-deep');
content = content.replace(/text-slate-400/g, 'text-slate');
content = content.replace(/bg-blue-600/g, 'bg-primary');
content = content.replace(/hover:bg-blue-500/g, 'hover:bg-primary-hover');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated PublicShareView.tsx theme classes');
