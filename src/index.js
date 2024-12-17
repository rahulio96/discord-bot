import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

dotenv.config();

const INTRO_PROMPT = "Hi, are your ready to fill out your **Daily Standup** update?";
const HOUR = "9";
const MINUTE = "0";

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

const yesBtn = new ButtonBuilder().setCustomId("yes").setLabel("Yes, I'm ready").setStyle(ButtonStyle.Primary);
const snoozeBtn = new ButtonBuilder().setCustomId("snooze").setLabel("Snooze").setStyle(ButtonStyle.Secondary);
const noBtn = new ButtonBuilder().setCustomId("no").setLabel("No, skip").setStyle(ButtonStyle.Secondary);

const actionRow = new ActionRowBuilder().addComponents(yesBtn, snoozeBtn, noBtn);

const replyToIntroPrompt = async ( interaction, text ) => {
    await interaction.update({
        content: `> ${text}`,
        embeds: [
            {
                description: INTRO_PROMPT,
            }
        ],
        components: [],
    });
}

client.on("ready", async () => {
    console.log("Ready for action!");

    // schedule.scheduleJob(`${MINUTE} ${HOUR} * * *`, async () => {
        console.log("Sending standup messages...");

        // Get the server ID
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (!guild) { 
            console.log("Server not found");
            return;
        }

        try {
            // Get all server members
            const members = await guild.members.fetch();

            // Send direct message to all users
            members.forEach(member => {
                if (!member.user.bot) {
                    try {
                        member.send({
                            embeds: [{ description: INTRO_PROMPT }],
                            components: [actionRow],
                        });
                    } catch (error) {
                        console.log(`Unable to send standup to ${member.user.tag}: `, error);
                    }
                }
            });
            console.log("Messages sent!");
        } catch (error) {
            console.log("Unable to get server members: ", error);
        }
    // });  
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
        return;
    }

    const user = interaction.user;

    // Switch case depending on button pressed
    switch (interaction.customId) {
        case "yes":
            replyToIntroPrompt(interaction, "Yes, I'm ready");
            break;

        case "snooze":
            replyToIntroPrompt(interaction, "Snooze");
            break;

        case "no":
            replyToIntroPrompt(interaction, "No, skip");
            break;
    }
});