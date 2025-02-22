export class PCGenerator
{

    async generatePCWithDialogue()
    {

    }

    getMageSkill(profession) {
        const api = game.bithirdbmod.api;
        let profSkills = profession.system.skills.split(',');
        for(let magicSkill of profSkills) {
            api.log("Mage-skilllist",magicSkill);
            let skill = game.items.getName(magicSkill.trim());
            if(!skill) continue;
            if(skill.system.skillType == "magic") {
                skill = foundry.utils.duplicate(skill);
                api.log("Mage-skill found",skill);
                return skill;
            }
        }
    }

    async generatePC(generatorSelection) {
        // Establish defaults we will use later on
        const api = game.bithirdbmod.api;
        let conf = game.bithirdbmod.config;
        let train = generatorSelection.train;
        api.log("Generating PC");

        // Make a list of mage occupation ids
        let mages = game.tables.getName(api.localize(`table_mage_profession`)).results.map(
            m_elem => { 
                return m_elem.documentId;
            }
        );
        const folderId = await api.getFolderId('Actor',api.localize('generatedActorFolder'));
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
        let kin, kinName;

        kin = game.items.get(generatorSelection.kin);
        if(kin) {
            kinName = kin.name; 
        } else {
            [kin, kinName] = await api.getRollTableValues(api.localize('table_kin') );            
        }
        allEmbeddedItems.push(kin);
        // Get kin ability
        let allKinAbilities = kin.system.abilities.split(',');
        for(let kinAbility of allKinAbilities) {
            const kinItem = foundry.utils.duplicate(game.items.getName(kinAbility.trim()));
            allEmbeddedItems.push(kinItem);
        }
        
        // Roll name
        let [nameItem, characterName] = await api.getRollTableValues(api.localize(`table_name`, { targettable:kinName}));
        actorDetails.name = characterName;
        // Roll profession - treat mage skills uniqely as it is a secondary skill
        let profession, professionName, mageSkill;
        profession = game.items.get(generatorSelection.profession);
        api.log("Profession name", profession);
        if(profession) {
            profession = foundry.utils.duplicate(profession);
            // TODO: Mage need to be in the professionName for table draws later
            if(mages.includes(profession._id)) {
                mageSkill = this.getMageSkill(profession);
                if(mageSkill)  {
                    allEmbeddedItems.push(mageSkill);
                }
                professionName = api.localize('mage_name');
                // Get Mage skill
            } else if(profession.type != "profession" ) {
                // For artisans, the profession item contains the master ability
                // So our educated guess is artisan if the profession ability is not a profession
                const profItem = foundry.utils.duplicate(profession);
                allEmbeddedItems.push(profItem);                
                profession = foundry.utils.duplicate(game.items.getName(api.localize("artisan_name")));
                // TODO: Artisan need to be in the professionName for table draws later
                professionName = profession.name; 
            } else {
                professionName = profession.name; 
            }
        } else {
            [profession, professionName] = await api.getRollTableValues(api.localize(`table_profession`));
            // Used later when we iterate and raise skills
            api.log(`Profession name[${professionName}]`);
            if(professionName.startsWith(api.localize('mage_starter'))) {    
                let [mageProfession, mageType] = await api.getRollTableValues(api.localize(`table_mage_profession`));   
                profession = mageProfession;
                // Need to handle secondary skills here 
                api.log("Mage profession selected:",mageProfession);
                mageSkill = this.getMageSkill(profession);
                if(mageSkill)  {
                    allEmbeddedItems.push(mageSkill);
                }
                professionName = api.localize('mage_name');
            } else if(professionName.startsWith(api.localize('artisan_starter') ) ) {
                // One of 
                let systemAbility = game.items.getName(api.localize(conf.artisans[Math.floor(Math.random()*conf.artisans.length)]));
                if(!systemAbility) {
                    api.log(`Could not find system ability ${profession.system.abilities}`, actorDetails,allEmbeddedItems );
                    return;
                }    
                let profItem = foundry.utils.duplicate(systemAbility);
                profItem.system.abilityType = "profession";
                allEmbeddedItems.push( profItem);
            } else {
                // profession heroic abilities 
                let systemAbility = game.items.getName(profession.system.abilities);
                if(!systemAbility) {
                    api.log(`Could not find system ability ${profession.system.abilities}`, actorDetails,allEmbeddedItems );
                    return;
                }
                let profItem = foundry.utils.duplicate(systemAbility);
                profItem.system.abilityType = "profession";
                allEmbeddedItems.push( profItem);
            }
        }
        api.log(`profession[${  JSON.stringify(profession)}] professionName[${professionName}]`);
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
                let r = await new Roll(copper[1]).roll();
                actorDetails.system.currency.cc = parseInt(r.total);
            }
            let silver = reSilver.exec(myItem);
            if(silver) { 
                let r = await new Roll(silver[1]).roll();
                actorDetails.system.currency.sc = parseInt(r.total);
            }
            let gold = reGold.exec(myItem);
            if(gold) { 
                let r = await new Roll(gold[1]).roll();
                actorDetails.system.currency.gc = parseInt(r.total);
            }
            let itemUUIDMatch = [...myItem.matchAll(/(\[\[\/roll (?<roll>[^\]]+)\]\])?x?@UUID\[(?<uuid>[^\]]+)]/g)]
            // let itemUUIDMatch = myItem.match(/(?<test>\[\[\/roll ([^\]]+)\]\]x)?UUID\[(?<uuid>[^\]]+)])/);
            if(!itemUUIDMatch || !itemUUIDMatch[0]) continue;
            let carriedTool = foundry.utils.duplicate(await fromUuid(itemUUIDMatch[0].groups['uuid']));
            if(['weapon','armor','helmet'].includes(carriedTool.type)) {
                carriedTool.system.worn = true;
            } else if(itemUUIDMatch[0].groups['roll']) { 
                carriedTool.system.quantity = (await (new Roll(itemUUIDMatch[0].groups['roll'])).roll()).total;
                api.log(`Rolled quantity [${carriedTool.name}] ${carriedTool.system.quantity}`);
            }
            allEmbeddedItems.push(carriedTool);
        }
        // Roll age
        const ageBonusSkillsCount = game.bithirdbmod.config.ageBonusSkillsCount;
        let [ageItemNotUsed, age] = await api.getRollTableValues(api.localize('table_age'));
        age = age.toLowerCase();
        actorDetails.system.age = ageBonusSkillsCount[age].key;
        
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
            const attribVal = await api.rollAttribute();
            actorDetails.system.attributes[`${attr}`] = {
                'base': attribVal
            };
        }
        
        api.log(actorDetails, allEmbeddedItems);
        
        let scriptActor = await Actor.create(actorDetails, { keepId : true} );
        await scriptActor.createEmbeddedDocuments("Item",allEmbeddedItems);
                
        // Train in abilities
        if(train) {
            let upgradeAbilities = [];
            let allAbilities = foundry.utils.duplicate(scriptActor.system.skills);
            let trainedAbilities = scriptActor.system.skills.filter( (elem) => { return elem.system.isProfessionSkill && elem.system.skillType != "magic"});
            api.log("All trainedAbilities",trainedAbilities,`remainder count[${allAbilities.length}]`);
            // 6 abilities from profession at 2x base chance
            for ( let i = 0; i<6; i++) {
                // Pick random ability
                let toRaise = trainedAbilities[Math.floor(Math.random()*trainedAbilities.length)];                
                upgradeAbilities.push({_id: toRaise._id, 'system.value' : scriptActor._getBaseChance(toRaise)*2 })
                api.log(`toRaise - profession[${toRaise.name}]`);
                trainedAbilities = trainedAbilities.filter( (elem) => elem != toRaise);    
                allAbilities = allAbilities.filter( (elem) => elem.name != toRaise.name);
            }
        
            api.log('levelling up skills - after profession',upgradeAbilities, `remainder count[${allAbilities.length}]`);
        
            // Increase abilities as per age
            for ( let i = 0; i<ageBonusSkillsCount[age].skills && allAbilities.length > 0; i++) {
                // Pick random ability
                let toRaise = allAbilities[Math.floor(Math.random()*allAbilities.length)];
                upgradeAbilities.push({_id: toRaise._id, 'system.value' : scriptActor._getBaseChance(toRaise)*2 })
                api.log(`toRaise - age[${toRaise.name}]`);
                allAbilities = allAbilities.filter( (elem) => elem.name != toRaise.name);    
            }
            api.log('levelling up skills - after age',upgradeAbilities, `got ageBonusSkillsCount[${age}].skills=${ageBonusSkillsCount[age].skills}`,`remainder count[${allAbilities.length}]`);
            // Mage skill
            if(mageSkill) {
                let toRaise = scriptActor.items.getName(mageSkill.name);
                upgradeAbilities.push({_id: toRaise._id, 'system.value' : scriptActor._getBaseChance(toRaise)*2 })
                api.log(`toRaise - mage[${toRaise.name}]`);
            }

            api.log('levelling up skills - final',upgradeAbilities);
            await scriptActor.updateEmbeddedDocuments("Item",upgradeAbilities);
        }
        await scriptActor.update( {"system.hitPoints.value":scriptActor.system.hitPoints.max,
                            "system.willPoints.value":scriptActor.system.willPoints.max});
        scriptActor.sheet.render(true);
    }

}