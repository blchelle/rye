#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2];

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: npm run release <patch|minor|major>');
  process.exit(1);
}

const exec = (cmd) => {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit' });
};

try {
  exec(`npm version ${bumpType} --no-git-tag-version`);

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  console.log(`Bumped version to ${version}`);

  exec('npm run build');

  const dmgFiles = fs.readdirSync('dist').filter(f => f.endsWith('.dmg'));
  if (dmgFiles.length === 0) {
    throw new Error('No .dmg file found in dist/');
  }

  const dmgPath = path.join('dist', dmgFiles[0]);
  console.log(`Found dmg: ${dmgPath}`);

  exec('git add package.json package-lock.json');
  exec(`git commit -m "v${version}"`);
  exec(`git tag v${version}`);
  exec('git push && git push --tags');

  exec(`gh release create v${version} "${dmgPath}" --title "v${version}" --generate-notes`);

  console.log(`\nRelease v${version} published successfully!`);
} catch (error) {
  console.error('Release failed:', error.message);
  process.exit(1);
}
