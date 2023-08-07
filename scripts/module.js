import { BITHIRDBMODCONF } from './config.js';
import { BithirDBMacros } from './lib/macros.js';
import { BithirDBApi } from './lib/api.js';

Hooks.once('init', async function() {
    game.settings.register(BITHIRMODCONF.moduleId, 'moduleVersion', {
        name: 'Module Version',
        scope: 'world',
        config: false,
        type: String,
        default: '0',
    });

    game.settings.register(BITHIRMODCONF.moduleId, 'devMessageVersionNumber', {
        name: 'Development message version',
        scope: 'world',
        config: false,
        type: String,
        default: '0',
    });

    game.bithirmod = {
        config: BITHIRMODCONF,
        macros: new BithirDBMacros(),
        api: new BithirDBApi()
    };

});

Hooks.once('ready', async function() {

});
