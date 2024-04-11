import { BITHIRDBMODCONF } from './config.js';
import { BithirDBMacros } from './lib/macros.js';
import { BithirDBApi } from './lib/api.js';
import { sendDevMessage } from './devmessage.js';

const adventurePack = `${BITHIRDBMODCONF.moduleId}.bithir-db-mods`;
const adventureName = "Required items for Bithir's mods";
const adventureJournalID = "fNYzxnciyk3yNl6v";

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

    game.bithirdbmod.config.title = game.modules.get(BITHIRDBMODCONF.moduleId).title;    
    game.modules.get(BITHIRDBMODCONF.moduleId).api = game.bithirdbmod.config;
    game.modules.get(BITHIRDBMODCONF.moduleId).api = game.bithirdbmod.macros;
    game.modules.get(BITHIRDBMODCONF.moduleId).api = game.bithirdbmod.api;

});

Hooks.once('ready', async function() {
    if (game.user.isGM) {
        ModuleImport();
        sendDevMessage();
    }
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_young')] = 2;
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_adult')] = 4;
    game.bithirdbmod.config.ageBonusSkillsCount[game.bithirdbmod.api.localize('age_old')] = 6;
});

export async function ModuleImport() {
    //
    // Imports all assets in the Adventure Collection.  
    // Will overwrite existing assets. 
    //
    const moduleVersion = game.modules.get(BITHIRDBMODCONF.moduleId)?.version;
    if(!foundry.utils.isNewerVersion(moduleVersion, game.settings.get(BITHIRDBMODCONF.moduleId, 'moduleVersion') ) ) {
        console.info(`moduleVersion[${moduleVersion}] is not newer than moduleVersion setting[${game.settings.get(BITHIRDBMODCONF.moduleId, 'moduleVersion')}]`);
        return;
    }

    const id = Hooks.on('importAdventure', (adventure, formData, created, updated) => {
        // console.log('adventure',adventure,'formData',formData,'created',created,'updated',updated)
        if (adventure.name === adventureName) {
            // console.log(`Removing hook[${id}]`);
            Hooks.off('importAdventure', id);
            if(created || updated) {
                game.settings.set(BITHIRDBMODCONF.moduleId, 'moduleVersion', moduleVersion);                
                ui.notifications.notify(`Import of ${adventureName} Complete`);
                const adventure = game.journals.get(adventureJournalID);
                adventure?.sheet.render(true);                
                return;
            } else {
                return ui.notifications.warn(`There was a problem with the Import of ${adventureName}`);
            }
        }
    });

    const pack = game.packs.get(adventurePack);
    const adventureId = pack.index.find(a => a.name === adventureName)?._id;    
    const adventure = await pack.getDocument(adventureId);
    await adventure.sheet.render(true);
};
