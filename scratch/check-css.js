import fs from 'fs';
import path from 'path';

const cssPath = 'e:/Labmetrix/Project-1/frontend/dist/assets/index-dlfuUMRr.css';
if (!fs.existsSync(cssPath)) {
  console.error('CSS file does not exist');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');

console.log('CSS length:', css.length);

const checkClasses = ['.flex', '.flex-col', '.w-full', '.max-w-md', '.grid'];
checkClasses.forEach(cls => {
  const index = css.indexOf(cls);
  console.log(`Class "${cls}" index: ${index} (Found: ${index !== -1})`);
  if (index !== -1) {
    // Print a small snippet around it
    console.log(`Snippet: ${css.slice(index, index + 150)}`);
  }
});
