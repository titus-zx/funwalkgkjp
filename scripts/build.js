const fs = require('node:fs');
fs.mkdirSync('public', {recursive:true});
fs.copyFileSync('Index.html', 'public/index.html');
