const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const cZipFile = path.join(rootDir, 'club-management-system.zip');
const dZipFile = 'D:\\club-management-system.zip';
const tempDir = path.join(rootDir, 'temp_zip_staging');

console.log('--- Packaging Club Management System ---');
console.log('Root Directory:', rootDir);

if (fs.existsSync(cZipFile)) fs.unlinkSync(cZipFile);
if (fs.existsSync(dZipFile)) {
  try { fs.unlinkSync(dZipFile); } catch (e) {}
}
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

fs.mkdirSync(tempDir, { recursive: true });

function copyRecursive(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const basename = path.basename(src);
    if (ignoreList.includes(basename)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (ignoreList.includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry), ignoreList);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy server
console.log('Copying server files (pure native Node.js, zero express)...');
copyRecursive(
  path.join(rootDir, 'server'),
  path.join(tempDir, 'server'),
  ['node_modules', 'data', '.git', 'club_management.sqlite']
);

// 2. Copy client
console.log('Copying client files...');
copyRecursive(
  path.join(rootDir, 'client'),
  path.join(tempDir, 'client'),
  ['node_modules', '.git']
);

// 3. Copy README
if (fs.existsSync(path.join(rootDir, 'README.md'))) {
  fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(tempDir, 'README.md'));
}

console.log('Compressing files into zip archive...');
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${cZipFile}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

// Copy to D:\ drive
console.log('Copying ZIP archive to D:\\ drive...');
try {
  fs.copyFileSync(cZipFile, dZipFile);
  const dStat = fs.statSync(dZipFile);
  console.log(`✓ Successfully saved to D:\\ drive (${(dStat.size / (1024 * 1024)).toFixed(2)} MB)`);
} catch (err) {
  console.error('Could not copy to D:\\ drive:', err.message);
}

// Clean up staging
fs.rmSync(tempDir, { recursive: true, force: true });

const cStat = fs.statSync(cZipFile);
console.log('========================================================');
console.log('🎉 ZIP Archives created successfully!');
console.log('1. D:\\ Drive Location:  D:\\club-management-system.zip');
console.log('2. Workspace Location:   ' + cZipFile);
console.log('File Size:              ' + (cStat.size / (1024 * 1024)).toFixed(2) + ' MB');
console.log('========================================================');
