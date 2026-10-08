const fs = require('fs');
const path = require('path');

const srcRoot = 'D:\\karthickclub\\club-management-system';
const dstRoot = 'D:\\Club-activities-management-system-main\\Club-activities-management-system-main';

function copyRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
    }
    const items = fs.readdirSync(src);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.system_generated') continue;
      copyRecursive(path.join(src, item), path.join(dst, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log('Copied:', dst);
  }
}

console.log('Starting copy from', srcRoot, 'to', dstRoot);
copyRecursive(path.join(srcRoot, 'client', 'src'), path.join(dstRoot, 'client', 'src'));
copyRecursive(path.join(srcRoot, 'client', 'package.json'), path.join(dstRoot, 'client', 'package.json'));
copyRecursive(path.join(srcRoot, 'server', 'controllers'), path.join(dstRoot, 'server', 'controllers'));
copyRecursive(path.join(srcRoot, 'server', 'routes'), path.join(dstRoot, 'server', 'routes'));
copyRecursive(path.join(srcRoot, 'server', 'scripts'), path.join(dstRoot, 'server', 'scripts'));
copyRecursive(path.join(srcRoot, 'server', 'data'), path.join(dstRoot, 'server', 'data'));
console.log('Sync finished successfully!');
