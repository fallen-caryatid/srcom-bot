module.exports = {
	name: 'runner pb',
	description: 'Get the personal best of a runner in a specific category of a game',
	execute: async function (Discord, message, args) {
        const querystring = require('querystring');
        const filter = args[0].charAt(0) === '/' ? querystring.stringify({ abbreviation: args[0].slice(1) }) : querystring.stringify({ name: args[0] });

        const fetch = require('node-fetch');
        const respInitial = await fetch(`https://www.speedrun.com/api/v1/games?${filter}&embed=categories,regions,platforms`);
        const initial = await respInitial.json();
        if (initial.data.length === 0) {
            message.reply('no game found');
        } else {
            let gameID = initial.data[0].id;
            let categoryID;
            for (i = 0; i < initial.data[0].categories.data.length; i++) {
                if (initial.data[0].categories.data[i].name.toLowerCase() == args[1].toLowerCase()) {
                    categoryID = initial.data[0].categories.data[i].id;
                    break;
                }
            }
            if (categoryID === undefined) {
                message.reply('no category found');
            } else {
                const search = querystring.stringify({ name: args[2] });
                const respNext = await fetch(`https://www.speedrun.com/api/v1/users?${search}`);
                const next = await respNext.json();
                if (next.data.length === 0) {
                    message.reply('no runner found');
                } else {
                    let userID = next.data[0].id;
                    const response = await fetch(`https://www.speedrun.com/api/v1/users/${userID}/personal-bests?game=${gameID}&embed=game,players,category`);
                    const body = await response.json();
                    if (body.data.length === 0) {
                        message.reply('runner has no PB in that game');
                    } else {
                        let data;
                        for (i = 0; i < body.data.length; i++) {
                            if (body.data[i].run.category === categoryID) {
                                data = body.data[i];
                                break;
                            }
                        }
                        if (data === undefined) {
                            message.reply('runner has no PB in that category');
                        } else {
                            let platform;
                            const platObj = initial.data[0].platforms.data.find(plat => plat.id === data.run.system.platform);
                            platform = platObj.name;
                            let region;
                            if (data.run.system.region === null) region = '';
                            else {
                                const regObj = initial.data[0].regions.data.find(reg => reg.id === data.run.system.region);
                                region = ' - ' + regObj.name;
                            }
                            let emu = data.run.system.emulated ? ' [EMU]' : '';
        
                            const time = require('../seconds.js');
                            const embed = new Discord.RichEmbed()
                                .setColor('#800020')
                                .setTitle(time.convert(data.run.times.primary_t) + ' by ' + data.players.data[0].names.international)
                                .setThumbnail(data.game.data.assets['cover-medium'].uri)
                                .setURL(data.run.weblink)
                                .setAuthor(data.game.data.names.international + ' - ' + data.category.data.name)
                                .setDescription('Leaderboard Rank: ' + data.place)
                                .addField('Date Played:', data.run.date)
                                .addField('Played On:', platform + region + emu)
                                .setTimestamp();
        
                            message.channel.send(embed);
                        }
                    }
                }
            }
        }
	}
};