const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const allDeps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
const missing = [];
for (const dep of Object.keys(allDeps || {})) {
  if (!fs.existsSync(path.join('node_modules', dep))) {
    missing.push(dep);
  }
}

if (missing.length > 0) {
  console.warn(`Missing dependencies: ${missing.join(', ')}`);
  console.warn('Run `npm install` before building.');
  process.exit(1);
}
