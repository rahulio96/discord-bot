import { buttonSelectResponse } from "../buttons/buttonInteraction.js";
import { message } from "../buttons/buttonInteraction.js";
import { INTRO_PROMPT, SNOOZE_PROMPT, introActionRow } from "../buttons/buttonConstants.js";
import schedule from 'node-schedule';

// Handle pre-made snooze options
const handleSnooze = async(interaction, snoozeTime, buttonLabel, isHours) => {
    await buttonSelectResponse(interaction, buttonLabel, SNOOZE_PROMPT);

    let timeUnit = "minutes";
    const displayTime = snoozeTime;

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

// Ignore if the response isn't a number
const snoozeFilter = response => {
    return !isNaN(parseFloat(response)) && isFinite(response);
} 

// Handle a user's custom snooze option
const handleCustomSnooze = async (interaction, buttonLabel) => {
    await buttonSelectResponse(interaction, buttonLabel, SNOOZE_PROMPT);
    await interaction.user.send({embeds: [{ description: "Please enter the number of hours you would like to snooze:" }] });

    try {
        // Await one valid message from the user
        const collected = await interaction.channel.awaitMessages({
            filter: snoozeFilter,
            max: 1,
            time: 0,
            errors: ['time'],
        });

        const snoozeTime = parseFloat(collected.first().content);
        
        // Prompt the user again after custom hours
        schedule.scheduleJob(new Date(Date.now() + snoozeTime * 60 * 60 * 1000), async () => {
            await interaction.user.send(message(INTRO_PROMPT, introActionRow));
        });

        // Confirmation message
        await interaction.user.send({
            content: `Reminding you in ${snoozeTime} ${snoozeTime === 1 ? "hour" : "hours"}`,
        });

    } catch (error) {
        console.log(error);
    }
}

export { handleCustomSnooze, handleSnooze };