const cp = require('child_process');
const packageJSON = require(process.cwd() + '/package.json');
if (!packageJSON['pre-commit'])
    packageJSON['pre-commit'] = [];
const preCommit = packageJSON['pre-commit'];
if (!preCommit.includes('bss_start-style-server')) {
    preCommit.push('barona_style_server');
}
if (!packageJSON.scripts)
    packageJSON.scripts = {};
const scripts = packageJSON.scripts;
scripts['barona_style_server'] = './node_modules/barona-style-server/bin/run.sh';
packageJSON.importSort = {
    '.js, .jsx, .ts, .tsx': {
        style: 'module',
        parser: 'typescript',
    },
};
