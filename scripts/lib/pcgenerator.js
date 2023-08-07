export class PCGenerator
{

    async generatePCWithDialogue()
    {

    }

    async generatePC() {
        let api = game.bithirdbmod.api;
        let conf = game.bithirdbmod.config;
        let train = true;
        const folderId = await api.getFolderId("Generated")
        const actorDetails = {
            type: "character",
            folder: null,
            sort: 12000,
            folder: folderId,
            system: {
                currency: {}
            },
            token: {},
            items: [],
            flags: {}        
        }
        
        let allEmbeddedItems = []
        
        // Roll kin
        let [kin, kinName] = await api.getRollTableValues(api.localize('table_kin') );
        allEmbeddedItems.push(kin);
        // Get kin ability
        let allKinAbilities = kin.system.abilities.split(',');
        for(let kinAbility of allKinAbilities) {
            allEmbeddedItems.push(game.items.getName(kinAbility.trim()));
        }
        
        // Roll name
        let [nameItem, characterName] = await api.getRollTableValues(api.localize(`table_name`, { targettable:kinName}));
        actorDetails.name = characterName;
        // Roll profession
        let [profession, professionName] = await api.getRollTableValues(api.localize(`table_profession`));
        console.log(`profession[${profession}] professionName[${professionName}]`);
        // Used later when we iterate and raise skills
        if(professionName.startsWith(api.localize('mage_starter'))) {    
            let [mageProfession, mageType] = await api.getRollTableValues(api.localize(`table_mage_profession`));   
            profession = mageProfession;
            // Need to handle secondary skills here 
            professionName = 'Mage';
        } else if(professionName.startsWith(api.localize('artisan_starter') ) ) {
            // One of 
            let systemAbility = game.items.getName(api.localize(api.artisans[Math.floor(Math.random()*api.artisans.length)]));
            if(!systemAbility) {
                console.log(`Could not find system ability ${profession.system.abilities}`, actorDetails,allEmbeddedItems );
                return;
            }    
            let profItem = duplicate(systemAbility);
            allEmbeddedItems.push( profItem);
        } else {
            // profession heroic abilities 
            let systemAbility = game.items.getName(profession.system.abilities);
            if(!systemAbility) {
                console.log(`Could not find system ability ${profession.system.abilities}`, actorDetails,allEmbeddedItems );
                return;
            }
            let profItem = duplicate(systemAbility);
            allEmbeddedItems.push( profItem);
        }
        allEmbeddedItems.push(profession);
        
        // Roll profession nickname
        let [professionNickItemNotUsed, professionNick] = await api.getRollTableValues(api.localize('table_nickname', {professionName:professionName}));
        actorDetails.name += ` ${professionNick}`;
        // Roll profession gear
        let [professionGearItemNotUsed, professionGearList] = await api.getRollTableValues(api.localize(`table_gear`, {professionName:professionName}));
        
        let itemToFind = professionGearList.split(",");



        for(let myItem of itemToFind) {
            // monies
            let reCopper = new RegExp(api.localize('copper'), 'g');
            let reSilver = new RegExp(api.localize('silver'), 'g');
            let reGold = new RegExp(api.localize('gold'), 'g');
            let copper = reCopper.exec(myItem); 
            if(copper) { 
                actorDetails.system.currency.cc = parseInt(copper);
            }
            let silver = reSilver.exec(myItem);
            if(silver) { 
                actorDetails.system.currency.sc = parseInt(silver);
            }
            let gold = reGold.exec(myItem);
            if(gold) { 
                actorDetails.system.currency.gc = parseInt(gold);
            }
            let itemUUIDMatch = [...myItem.matchAll(/(?<roll>\[\[\/roll ([^\]]+)\]\])?x?UUID\[(?<uuid>[^\]]+)]/g)]
            // let itemUUIDMatch = myItem.match(/(?<test>\[\[\/roll ([^\]]+)\]\]x)?UUID\[(?<uuid>[^\]]+)])/);
            if(!itemUUIDMatch) continue;
            let carriedTool = await fromUuid(itemUUIDMatch.groups['UUID']);
            if(['weapon','armor','helmet'].includes(carriedTool.type)) {
                carriedTool.system.worn = true;
            } else if(itemUUIDMatch.groups['roll']) { 
                carriedTool.system.quantity = await (new Roll(itemUUIDMatch.groups['roll'])).roll();
            }
            allEmbeddedItems.push(carriedTool);
        }
        // Roll age
        let [ageItemNotUsed, age] = await api.getRollTableValues(api.localize('table_age'));
        actorDetails.system.age = age;
        
        // Increase abilities as per age
        
        // Roll weakness
        let [weaknessItemNotUsed, weakness] = await api.getRollTableValues(api.localize(`table_weakness`));
        actorDetails.system.weakness = weakness;
        
        // Roll appearance
        let [appeanceItemNotUsed, appearance] = await api.getRollTableValues(api.localize(`table_appearance`));
        actorDetails.system.appearance = appearance;
        
        // Roll memento
        let [mementoItem, memento] = await api.getRollTableValues(api.localize(`table_memento`));
        allEmbeddedItems.push(mementoItem);
        
        // Roll all attributes
        const attributes = ['agl', 'cha','con','int','str','wil'];
        actorDetails.system.attributes = {};
        for(let attr of attributes) {
            actorDetails.system.attributes[`${attr}.value`] = await api.rollAttribute();
        }
        
        console.log(actorDetails, allEmbeddedItems);
        
        let scriptActor = await Actor.create(actorDetails);
        await scriptActor.createEmbeddedDocuments("Item",allEmbeddedItems);
        
        // Train in abilities
        if(train) {
            let upgradeAbilities = [];
            let allAbilities = duplicate(scriptActor.system.skills);
            trainedAbilities = scriptActor.system.skills.filter( (elem) => { return elem.system.isProfessionSkill});
            console.log("All trainedAbilities",trainedAbilities);
            // 6 abilities from profession at 2x base chance
            for ( let i = 0; i<6; i++) {
                // Pick random ability
                let toRaise = trainedAbilities[Math.floor(Math.random()*trainedAbilities.length)];
                upgradeAbilities.push({_id: toRaise._id, 'system.value' : scriptActor._getBaseChance(toRaise)*2 })
                trainedAbilities = trainedAbilities.filter( (elem) => elem != toRaise);    
                allAbilities = allAbilities.filter( (elem) => elem != toRaise);
            }
        
            console.log('allAbilities', allAbilities)
            const ageBonusSkillsCount = {};
            ageBonusSkillsCount[api.localize(age_young)] =2;
            ageBonusSkillsCount[api.localize(age_adult)] =4;
            ageBonusSkillsCount[api.localize(age_old)] =6;
            for ( let i = 0; i<ageBonusSkillsCount[age] && allAbilities.length > 0; i++) {
                // Pick random ability
                let toRaise = allAbilities[Math.floor(Math.random()*allAbilities.length)];
                console.log(toRaise);
                upgradeAbilities.push({_id: toRaise._id, 'system.value' : scriptActor._getBaseChance(toRaise)*2 })
                allAbilities = allAbilities.filter( (elem) => elem != toRaise);    
            }
        
        
            await scriptActor.updateEmbeddedDocuments("Item",upgradeAbilities);
        }
        
        scriptActor.sheet.render(true);
    }

}