import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { Client, GatewayIntentBits } from 'discord.js';
import Database from "better-sqlite3";
import { onInteractionCreate } from './client/interactionCreate.js';
import { initDb, msgServerUsers } from './client/ready.js';

dotenv.config();

const db = new Database("./data/standups.db");

// Time that startup message will be sent
const HOUR = process.env.HOUR || "0";
const MINUTE = process.env.MINUTE || "0";

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

    await initDb(db);

    // Send a message at a specific time every day
    schedule.scheduleJob(`${MINUTE} ${HOUR} * * *`, async () => {
        console.log("Sending standup messages...");

        // Get the server ID
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) { 
            console.log("Server not found");
            return;
        }

        // Message all server users
        await msgServerUsers(guild, db);

    });  
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
        return;
    }
    await onInteractionCreate(interaction, interaction.customId, db, client);
});