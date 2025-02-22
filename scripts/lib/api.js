export class BithirDBApi
{
    constructor() {
    }
    
    log(...args) {

        if(game.settings.get(game.bithirdbmod.config.moduleId,"debugmode") )
            return console.log('%cBithir dragonbane mod |', "font-weight: bold;color:goldenrod;", ...args);
        return null;
    }

    localize(key, repl) {
        if(repl) {
            // user format instead of localize
            return game.i18n.format(`${game.bithirdbmod.config.i18nPath}${key}`,repl);
        }
        return game.i18n.localize(`${game.bithirdbmod.config.i18nPath}${key}`);
    }

    get hasCoreSetEnabled() {
        return game.modules.get("dragonbane-grundspel")?.active || game.modules.get("dragonbane-coreset")?.active
    }

    async rollAttribute() {
        let roll = new Roll('4d6dl');
        roll = await roll.evaluate();
        return roll.total;
    }

    async getFolderId(folderType, folderName) {
        let folder = game.folders.filter( f => { return f.name == folderName && f.type == 'Actor'; });
        if(folder.length == 0) {
            // Create folder            
            let f = await Folder.create({
                name: folderName,
                type: folderType,
            });
            return f.id;
        } else { 
            return folder[0].id;
        }
    }

    async getRollTableValues(tableName) {
        const api = game.bithirdbmod.api;
        const table = game.tables.getName(tableName);
        if(!table) {
            return api.log(`Could not find table[${tableName}]`);
        }
        const drawResult = (await table.roll()).results[0];
        let item = null;
        let text = drawResult.text;
        if(drawResult.documentCollection === 'Item') {
            let tableItem = game.items.get(drawResult.documentId);
            if(!tableItem) {
                api.log(`Could not retrieve item for ${tableName} with result`, drawResult);
                tableItem = game.items.getName(drawResult.text);
                if(!tableItem) {
                    api.log(`Failback to use text instead of table item failed for ${tableName} with result`, drawResult);
                }
            } else {
                item = foundry.utils.duplicate(game.items.get(drawResult.documentId));
            }
        }
        return [item, text];
    }
    

    pagePopup(journalId, pageId) {
        const config = game.bithirdbmod.config;
        if( !journalId || !pageId ) {
            return ui.notification.error(`[${game.modules.get(config.moduleId).title}] Can't popout without both Journal ID and Page ID`);
        }
        const TEMP_STORAGE = config.moduleId;
        if( !document[TEMP_STORAGE] ) {
            document[TEMP_STORAGE] = {};
        }
        
        const journal = game.journal.get(journalId);
        
        const html = journal.pages.get(pageId).text.content;
        
        let myDialog = ui.windows[document[TEMP_STORAGE][pageId]];
        
        if( myDialog ) {
            myDialog.close({});
            delete document[TEMP_STORAGE][pageId];
            return;
        }
        
        myDialog = new Dialog({
                    title: "Quick Tips",
                    content: `<div class='bithirmod'>${html}</div>`,
                    options: {
                        width: 900,
                        resizable: true,
                    },
                    callback: () => {},
        buttons: {  }
        });
        document[TEMP_STORAGE][pageId] = myDialog.appId;
        myDialog.render(true);        
    }
}
