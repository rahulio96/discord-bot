import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

// Bot prompts the user with the following
const INTRO_PROMPT = "Hi, are your ready to fill out your **Daily Standup** update?";
const SNOOZE_PROMPT = "Ok, when would you like me to remind you?"

// Intro button labels
const YES_LABEL = "Yes, I'm ready";
const SNOOZE_LABEL = "Snooze";
const NO_LABEL = "No, skip";

// Intro buttons
const yesBtn = new ButtonBuilder().setCustomId("yes").setLabel(YES_LABEL).setStyle(ButtonStyle.Primary);
const snoozeBtn = new ButtonBuilder().setCustomId("snooze").setLabel(SNOOZE_LABEL).setStyle(ButtonStyle.Secondary);
const noBtn = new ButtonBuilder().setCustomId("no").setLabel(NO_LABEL).setStyle(ButtonStyle.Secondary);

// Snooze buttons
const snooze15min = new ButtonBuilder().setCustomId("15").setLabel("15 min").setStyle(ButtonStyle.Secondary);
const snooze30min = new ButtonBuilder().setCustomId("30").setLabel("30 min").setStyle(ButtonStyle.Secondary);
const snooze1hr = new ButtonBuilder().setCustomId("1").setLabel("1 hour").setStyle(ButtonStyle.Secondary);
const snoozeCustom = new ButtonBuilder().setCustomId("custom").setLabel("Custom").setStyle(ButtonStyle.Secondary);

// Action rows
const introActionRow = new ActionRowBuilder().addComponents(yesBtn, snoozeBtn, noBtn);
const snoozeActionRow = new ActionRowBuilder().addComponents(snooze15min, snooze30min, snooze1hr, snoozeCustom);

export { YES_LABEL, SNOOZE_LABEL, NO_LABEL, INTRO_PROMPT, SNOOZE_PROMPT, introActionRow, snoozeActionRow };