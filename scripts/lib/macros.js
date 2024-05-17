import {PCGenerator} from './pcgenerator.js';

export class BithirDBMacros
{
    async generatePCNoDialog() {
        const config = game.bithirdbmod.config;
        const defaultSettings = game.user.getFlag(config.moduleId, 'generatorDefaults') ?? config.generatorDefaults;
        let pc = new PCGenerator()
        pc.generatePC(defaultSettings);
    }

    async generatePC() {
        const api = game.bithirdbmod.api;
        const config = game.bithirdbmod.config;
        const dialogId = `${config.moduleId}-${foundry.utils.randomID()}`;
        const defaultRandom = [`<option value='-1'>${api.localize('random')}</option>`];
        const defaultSettings = game.user.getFlag(config.moduleId, 'generatorDefaults') ?? config.generatorDefaults;

        const kinTable = game.tables.getName(api.localize('table_kin'));
        const kinOptions = defaultRandom.concat(kinTable.results.map( elem => { return `<option value='${elem.documentId}' ${defaultSettings.kin == elem.documentId ? "selected='selected'":""}>${elem.text}</option>`; }));

        const professionTable = game.tables.getName(api.localize('table_profession'));
        const mages = [];
        const artisans = [];
        const additionalItems = [];        

        const professionOptions = defaultRandom.concat(professionTable.results.map( elem => { 
            if(elem.text.startsWith(api.localize('mage_starter'))) {
                return game.tables.getName(api.localize(`table_mage_profession`)).results.map(
                    m_elem => { 
                        mages.push(m_elem.documentId);
                        return `<option value='${m_elem.documentId}' ${defaultSettings.profession == m_elem.documentId ? "selected='selected'":""}>${m_elem.text}</option>`; }
                );
            } else if(elem.text.startsWith(api.localize('artisan_starter'))) {
                return config.artisans.map(
                    a_elem => {
                        // locate element
                        let item = game.items.getName(api.localize(a_elem));
                        if(item == null) { return ''}

                        artisans.push(item.id);
                        return `<option value='${item.id}' ${defaultSettings.profession == item.id ? "selected='selected'":""}>${item.name}</option>`
                    }
                );
            } else {
                return `<option value='${elem.documentId}' ${defaultSettings.profession == elem.documentId ? "selected='selected'":""}>${elem.text}</option>`;
            } 
        }));

        const dialog_content = `<div class="bdmgendiag"><div class="flexrow headerrow"><div class='header'>${api.localize('generatorTitle')}</div></div>
        <div class="flexrow"><table><tbody><tr>
            <th><label for='${dialogId}-kin'>${api.localize('table_kin')}</label></th>
            <td>
                <select id='${dialogId}-kin' name='kinOption'>${kinOptions}</select>
            </td>
        </tr></tbody></table></div>
        <div class="flexrow"><table><tbody><tr>
            <th><label for='${dialogId}-profession'>${api.localize('table_profession')}</label></th>
            <td>
                <select id='${dialogId}-profession' name='professionOption'>${professionOptions}</select>
            </td>
        </tr></tbody></table></div>
        <div class="flexrow"><table><tbody><tr>
            <th><label for='${dialogId}-train'>${api.localize('randomTrain')}</label></th>
            <td>
                <input class='checkbox' type='checkbox' ${defaultSettings.train ? 'checked':''} value='true' name='train'>
            </td>
        </tr></tbody></table></div>
        <div class="flexrow"><table><tbody><tr>
            <th><label for='${dialogId}-save'>${api.localize('saveAsDefault')}</label></th>
            <td>
                <input id='${dialogId}-save' class='checkbox' type='checkbox' value='true' name='saveAsDefault'>
            </td>
        </tr></tbody></table></div>
        </div>`;
        let x = new Dialog({
            content : dialog_content,
            buttons : 
            {
            Ok : { 
                label : game.i18n.localize("OK"), callback : async (html)=> {
                    let generatorSelection = {
                        kin: html.find("select[name='kinOption']").val(),
                        profession: html.find("select[name='professionOption']").val(),
                        train: html.find("input[name='train']")[0].checked,
                    }
                    console.log(`generatorSelection`,generatorSelection);

                    if(html.find("input[name='saveAsDefault']")[0].checked) { 
                        game.user.setFlag(config.moduleId, 'generatorDefaults', generatorSelection);
                    }                    
                    let pc = new PCGenerator()
                    pc.generatePC(generatorSelection);
                }
            },
            Cancel : {label : game.i18n.localize("CANCEL")}
            }
        });
        
        x.options.width = 400;
        x.position.width = 400;
        
        x.render(true);
    }
}