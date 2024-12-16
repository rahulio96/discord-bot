import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle } from 'discord.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", async () => {
    console.log("Ready for action!");

    schedule.scheduleJob('55 12 * * *', async () => {
        console.log("Sending standup messages...");

        // Get the server ID
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) { 
            console.log("Server not found");
            return;
        }

        try {
            // Get all server member IDs
            const members = await guild.members.fetch();

            // Send direct message to all users
            members.forEach(member => {
                if (!member.user.bot) {
                    try {
                        member.send({
                            content: "Daily Standup Reminder!",
                            components: [],
                        });
                    } catch (error) {
                        console.log(`Unable to send standup to ${member.user.tag}: `, error)
                    }
                }
            })
            console.log("Messages sent!")
        } catch (error) {
            console.log("Unable to get server members: ", error);
        }
    });

    
})



/*              Echo user's message              */

// client.on("messageCreate", async (message) => {
//     console.log(message);
//     const messageContent = message.content;

//     if (!message?.author.bot) {
//         message.reply(`Haha you said: ${messageContent}`);
//     }
    
// });