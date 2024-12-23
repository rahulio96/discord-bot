import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

dotenv.config();

// Bot prompts the user with the following
const INTRO_PROMPT = "Hi, are your ready to fill out your **Daily Standup** update?";
const SNOOZE_PROMPT = "Ok, when would you like me to remind you?"

// Intro button labels
const YES_LABEL = "Yes, I'm ready";
const SNOOZE_LABEL = "Snooze";
const NO_LABEL = "No, skip";

// Time that startup message will be sent
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

// Intro buttons
const yesBtn = new ButtonBuilder().setCustomId("yes").setLabel(YES_LABEL).setStyle(ButtonStyle.Primary);
const snoozeBtn = new ButtonBuilder().setCustomId("snooze").setLabel(SNOOZE_LABEL).setStyle(ButtonStyle.Secondary);
const noBtn = new ButtonBuilder().setCustomId("no").setLabel(NO_LABEL).setStyle(ButtonStyle.Secondary);

const introActionRow = new ActionRowBuilder().addComponents(yesBtn, snoozeBtn, noBtn);

// Message with embeded message and button(s)
function message(prompt, actionRow) {
    return {
        embeds: [{ description: prompt }],
        components: [actionRow],
    }
}

// Snooze buttons
const snooze15 = new ButtonBuilder().setCustomId("15").setLabel("15 min").setStyle(ButtonStyle.Primary);

const snoozeActionRow = new ActionRowBuilder().addComponents(snooze15);

const buttonSelectResponse = async (interaction, selectedButtonText,  originalBotResponse) => {
    interaction.update({
        content: `> ${selectedButtonText}`,
        embeds: [{ description: originalBotResponse }],
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
                        member.send(message(INTRO_PROMPT, introActionRow));
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
            await buttonSelectResponse(interaction, YES_LABEL, INTRO_PROMPT);
            break;

        case "snooze":
            await buttonSelectResponse(interaction, SNOOZE_LABEL, INTRO_PROMPT);
            await user.send(message(SNOOZE_PROMPT, snoozeActionRow));
            break;

        case "no":
            await buttonSelectResponse(interaction, NO_LABEL, INTRO_PROMPT);
            break;

        case "15":
            await buttonSelectResponse(interaction, "15 min", SNOOZE_PROMPT);
            await user.send({
                content: "Reminding you in 15 minutes!",
            });

            schedule.scheduleJob(new Date(Date.now() + 15 * 60 * 1000), async () => {
                try {
                    await user.send(message(INTRO_PROMPT, introActionRow));
                } catch (error) {
                    console.error(`Failed to send reminder to ${user.displayName}:`, error);
                }
            });
            break;
    }
});