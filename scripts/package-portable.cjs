const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=====================================================================');
console.log('         Tier 3: Packaging Standalone Portable Distribution');
console.log('=====================================================================');

const portableDir = path.resolve(__dirname, '../portable');
const releaseDir = path.resolve(__dirname, '../release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const zipPath = path.join(releaseDir, 'open-iptv-portable-win64.zip');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('[*] Creating portable zip archive:', zipPath);
console.log('[*] Compressing portable directory...');

// Use PowerShell Compress-Archive
const cmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${portableDir}\\*' -DestinationPath '${zipPath}' -Force"`;
execSync(cmd, { stdio: 'inherit' });

const stats = fs.statSync(zipPath);
console.log('\n[SUCCESS] Packaged OpenIPTV Portable!');
console.log('Archive File: ', zipPath);
console.log('Archive Size: ', (stats.size / 1024 / 1024).toFixed(2), 'MB');
console.log('Ready to copy to any USB flash drive or Windows PC with ZERO installation!');
