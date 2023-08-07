
export function sendDevMessage() 
{
    if( game.user.isGM ) {
        let jqxhr = $.getJSON( "https://raw.githubusercontent.com/bithir/dragonbane-bithir-mod/master/msgdata/data.json", function(data) 
        {                    
            let latestVersion = game.settings.get(game.bithirmod.config.moduleId, 'devMessageVersionNumber');
            if(isNaN(latestVersion)) {
                latestVersion = 0;
            }
            if(data.messages === undefined || data.messages === null || data.messages.length === undefined) {
                return;
            }

            for(let i = 0; i < data.messages.length; i++)
            {
                let msgenvelope = data.messages[i];
                if( msgenvelope.version > latestVersion )
                {
                    ChatMessage.create(
                    {
                        speaker: ChatMessage.getSpeaker({alias: "Bithir's mod News"}),
                        whisper: [game.user],
                        content: msgenvelope.message        
                    });        
                }
                latestVersion = Math.max(latestVersion, msgenvelope.version);
            }
            game.symbaroum.info("Message system - latestVersion message after "+latestVersion);
            game.settings.set(game.bithirmod.config.moduleId, 'devMessageVersionNumber', latestVersion);
        })
        .fail(function(data) {
            game.symbaroum.error("Could not retreive Bithir mods news Message:"+JSON.stringify(data));
        });
    }    
}