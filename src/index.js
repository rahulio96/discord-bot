import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import Database from "better-sqlite3";

dotenv.config();

const db = new Database("./data/standups.db");

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

const formatDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

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
    await interaction.user.send({embeds: [{ description: "Please enter the number of hours you would like to snooze:" }] });

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
    }
}

const handleUserStandup = async (interaction) => {
    const messages = await interaction.channel.messages.fetch({ limit: 1 });
    const botMessage = messages.find(msg => msg.author.bot);
    const userPlan = await db.prepare(
        `SELECT * FROM standup 
        WHERE user_id = ? 
        ORDER BY created_at 
        DESC LIMIT 1`
    ).get(interaction.user.id);

    const date = new Date();
    
    let prevDayPlan; 

    if (userPlan) {
        const prevDate = new Date(userPlan.created_at);
        prevDayPlan = `Daily Standup check-in for ${formatDate.format(date)}` +
        `\n\nYour previous day plan (${formatDate.format(prevDate)}):` +
        `\n${userPlan.plan}` +
        "\n\nWhat did you complete in the previous day?";
    } else {
        prevDayPlan = "Welcome to your first standup! What are you planning on working on today?";
    }

    try {
        await interaction.user.send({
            content: prevDayPlan,
            ...(botMessage && { reply: { messageReference: botMessage.id } }),
        });

        let work = "";

        if (userPlan) {
            work = await interaction.channel.awaitMessages({
                max: 1,
                time: 30_000,
                errors: ['time'],
            });
            await interaction.user.send({content: "Great, what are you planning on working on today?"});
            work = work.first().content;
        }

        const plan = await interaction.channel.awaitMessages({
            max: 1,
            time: 30_000,
            errors: ['time'],
        });
        
        await interaction.user.send({content: "Got it, do you have any blockers? If not, please say: `no`."});

        const blockers = await interaction.channel.awaitMessages({
            max: 1,
            time: 30_000,
            errors: ['time'],
        });

        const isNo = blockers.first().content.toLowerCase().trim() === "no";

        db.prepare(
            `INSERT INTO standup (user_id, work, plan, blockers) VALUES (?, ?, ?, ?)`
        ).run(interaction.user.id, work, plan.first().content, blockers.first().content);

        await interaction.user.send({content: "Thanks for completing your standup, have a nice day!"});

        // post standup in channel for server
        await client.channels.cache.get(process.env.CHANNEL_ID).send({
            content: "**Daily Standup Check-In:**",
            embeds: [{
                author: {
                    name: interaction.user.displayName,
                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                },
                color: 0X808080,
            }, {
                title: "**Previous Day's Progress**",
                description: work,
                color: 0X0096FF,
            }, {
                title: "**Today's Plan**",
                description: plan.first().content,
                color: 0X0096FF,
            }, ...(
                !isNo ? [{
                    title: "**Blockers**",
                    description: blockers.first().content,
                    color: 0XFF0000,
            }] : [])],
        });

    } catch (error) {
        console.log(error);
    }   
}

client.on("ready", async () => {
    console.log("Ready for action!");

    db.prepare(
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS standup (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            work TEXT NOT NULL,
            plan TEXT NOT NULL,
            blockers TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`
    ).run();

    console.log('Connected to the database!');

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
                    // Add user to db
                    db.prepare(
                        `INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)`
                    ).run(member.user.id, member.user.globalName);

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
            await handleUserStandup(interaction);
            break;

        case "snooze":
            await buttonSelectResponse(interaction, SNOOZE_LABEL, INTRO_PROMPT);
            await interaction.user.send(message(SNOOZE_PROMPT, snoozeActionRow));
            break;

        case "no":
            await buttonSelectResponse(interaction, NO_LABEL, INTRO_PROMPT);
            await interaction.user.send({
                content: `Skipping today's standup, see you tomorrow!`,
            });
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