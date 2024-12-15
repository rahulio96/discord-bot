import dotenv from 'dotenv'
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js'

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

client.on("ready", async (e) => {
    console.log("Ready for action!");
})

client.on("messageCreate", async (message) => {
    console.log(message);
    const messageContent = message.content;

    if (!message?.author.bot) {
        message.reply(`Haha you said: ${messageContent}`)
    }
    
});