export class BithirDBApi
{
    constructor() {
    }

    localize(key, repl) {
        if(repl) {
            // user format instead of localize
            return game.i18n.format(`${game.bithirdbmod.config.i18nPath}${key}`,repl);
        }
        return game.i18n.localize(`${game.bithirdbmod.config.i18nPath}${key}`);
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
        const table = game.tables.getName(tableName);
        if(!table) {
            return console.log(`Could not find table[${tableName}]`);
        }
        const drawResult = (await table.roll()).results[0];
        let item = null;
        let text = drawResult.text;
        if(drawResult.documentCollection === 'Item') {
            let tableItem = game.items.get(drawResult.documentId);
            if(!tableItem) {
                console.log(`Could not retrieve item for ${tableName} with result`, drawResult);
                tableItem = game.items.getName(drawResult.text);
                if(!tableItem) {
                    console.log(`Failback to use text instead of table item failed for ${tableName} with result`, drawResult);
                }
            } else {
                item = duplicate(game.items.get(drawResult.documentId));
            }
        }
        return [item, text];
    }
    
}
