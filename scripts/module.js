import { BITHIRDBMODCONF } from './config.js';
import { BithirDBMacros } from './lib/macros.js';
import { BithirDBApi } from './lib/api.js';

Hooks.once('init', async function() {
    game.settings.register(BITHIRDBMODCONF.moduleId, 'moduleVersion', {
        name: 'Module Version',
        scope: 'world',
        config: false,
        type: String,
        default: '0',
    });

    game.settings.register(BITHIRDBMODCONF.moduleId, 'devMessageVersionNumber', {
        name: 'Development message version',
        scope: 'world',
        config: false,
        type: String,
        default: '0',
    });

    game.bithirdbmod = {
        config: BITHIRDBMODCONF,
        macros: new BithirDBMacros(),
        api: new BithirDBApi()
    };
});

Hooks.once('ready', async function() {
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_young')] = 2;
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_adult')] = 4;
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_old')] = 6;

});
