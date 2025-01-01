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
const snooze15min = new ButtonBuilder().setCustomId("15").setLabel("15 min").setStyle(ButtonStyle.Secondary);
const snooze30min = new ButtonBuilder().setCustomId("30").setLabel("30 min").setStyle(ButtonStyle.Secondary);
const snooze1hr = new ButtonBuilder().setCustomId("1").setLabel("1 hour").setStyle(ButtonStyle.Secondary);
const snoozeCustom = new ButtonBuilder().setCustomId("custom").setLabel("Custom").setStyle(ButtonStyle.Secondary);

const snoozeActionRow = new ActionRowBuilder().addComponents(snooze15min, snooze30min, snooze1hr, snoozeCustom);

const buttonSelectResponse = async (interaction, selectedButtonText,  originalBotResponse) => {
    await interaction.update({
        content: `> ${selectedButtonText}`,
        embeds: [{ description: originalBotResponse }],
        components: [],
    });
}

const handleSnooze = async(interaction, snoozeTime, buttonLabel, isHours) => {
    await buttonSelectResponse(interaction, buttonLabel, SNOOZE_PROMPT);

    let timeUnit = "minutes";
    const displayTime = snoozeTime;

    // no custom amount and there's only the option for 1 hour
    if (isHours) {
        timeUnit = "hour";
        snoozeTime = snoozeTime * 60;
    }
    
    await interaction.user.send({
        content: `Reminding you in ${displayTime} ${timeUnit}!`,
    });

    schedule.scheduleJob(new Date(Date.now() + snoozeTime * 60 * 1000), async () => {
        try {
            await interaction.user.send(message(INTRO_PROMPT, introActionRow));
        } catch (error) {
            console.error(`Failed to send reminder to ${user.displayName}:`, error);
        }
    });
}

const snoozeFilter = response => {
    // ignore if the response isn't a number
    return !isNaN(parseFloat(response)) && isFinite(response);
} 

const handleCustomSnooze = async (interaction, buttonLabel) => {
    await buttonSelectResponse(interaction, buttonLabel, SNOOZE_PROMPT);
    await interaction.user.send({embeds: [{ description: "How many hours would you like to snooze?" }]});

    try {
        // await one valid message from the user
        const collected = await interaction.channel.awaitMessages({
            filter: snoozeFilter,
            max: 1,
            time: 30_000,
            errors: ['time'],
        });

        const snoozeTime = parseFloat(collected.first().content);
        
        // prompt the user again after custom hours
        schedule.scheduleJob(new Date(Date.now() + snoozeTime * 60 * 60 * 1000), async () => {
            await interaction.user.send(message(INTRO_PROMPT, introActionRow));
        });

        // confirmation message
        await interaction.user.send({
            content: `Reminding you in ${snoozeTime} ${snoozeTime === 1 ? "hour" : "hours"}`,
        });

    } catch (error) {
        console.log(error);
        await interaction.user.send({
            content: "Error has occurred"
        })
    }
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

    const id = interaction.customId;

    switch (id) {
        case "yes":
            await buttonSelectResponse(interaction, YES_LABEL, INTRO_PROMPT);
            break;

        case "snooze":
            await buttonSelectResponse(interaction, SNOOZE_LABEL, INTRO_PROMPT);
            await interaction.user.send(message(SNOOZE_PROMPT, snoozeActionRow));
            break;

        case "no":
            await buttonSelectResponse(interaction, NO_LABEL, INTRO_PROMPT);
            break;

        case "15":
            await handleSnooze(interaction, 15, "15 min", false);
            break;

        case "30":
            await handleSnooze(interaction, 30, "30 min", false);
            break;

        case "1":
            await handleSnooze(interaction, 1, "1 hour", true);
            break;

        case "custom":
            await handleCustomSnooze(interaction, "Custom");
            break;         
    }
});