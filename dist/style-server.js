#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const karhu_1 = require("karhu");
const memoize_1 = __importDefault(require("lodash/memoize"));
const log = karhu_1.context('style-server');
const app = express_1.default();
const port = +(process.env.BSS_PORT || process.env.PORT || '15077');
app.use(body_parser_1.default.text({ limit: 1024 * 1024 * 10 }));
let lastRequest = new Date();
const getCliEngine = memoize_1.default(dir => {
    const cwd = process.cwd();
    process.chdir(dir);
    const cli = new (requireLib(dir, 'eslint').CLIEngine)({});
    process.chdir(cwd);
    return cli;
});
app.use((_req, _res, next) => {
    lastRequest = new Date();
    next();
});
app.post('/eslint', (req, res) => {
    const { filename, baseDir } = req.query, body = req.body;
    const cli = getCliEngine(path_1.default.dirname(path_1.default.resolve(baseDir, filename)));
    const report = cli.executeOnText(body, filename);
    if (report.errorCount || report.warningCount) {
        res.status(400);
        res.send(cli.getFormatter()(report.results));
        return;
    }
    res.status(200);
    res.send('');
});
app.post('/prettier', async (req, res) => {
    try {
        const { filename, baseDir, inPlace } = req.query;
        const fullFilename = path_1.default.resolve(baseDir, filename);
        // eslint-disable-next-line no-sync
        const data = inPlace ? fs_1.default.readFileSync(fullFilename, 'utf-8') : req.body;
        const prettier = requireLib(baseDir, 'prettier');
        const config = await prettier.resolveConfig(fullFilename);
        const output = prettier.format(data, Object.assign(Object.assign({}, config), { filepath: fullFilename }));
        if (inPlace) {
            // eslint-disable-next-line no-sync
            fs_1.default.writeFileSync(fullFilename, output, 'utf-8');
        }
        res.send(output);
    }
    catch (err) {
        res.status(500);
        res.send(err.message);
    }
});
const server = app.listen(port);
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        process.exit(0);
    }
    log.error(err);
    process.exit(1);
});
const shutdownInterval = setInterval(maybeShutdown, +(process.env.BSS_DELAY || 6000));
function maybeShutdown() {
    if (new Date().valueOf() - lastRequest.valueOf() > 5 * 1000) {
        server.close();
        clearInterval(shutdownInterval);
    }
}
function requireLib(dir, library) {
    if (dir === '/')
        throw new Error('Failed to find ' + library);
    const libraryDir = path_1.default.join(dir, 'node_modules', library);
    if (!fs_1.default.existsSync(libraryDir)) {
        return requireLib(path_1.default.join(dir, '..'), library);
    }
    const packageJson = require(path_1.default.join(libraryDir, 'package.json'));
    const libFile = path_1.default.join(libraryDir, packageJson.main);
    return require(libFile);
}
