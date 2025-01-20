import { message, buttonSelectResponse } from "../buttons/buttonInteraction.js";
import { handleUserStandup } from "../handlers/standup.js";
import { handleSkip } from "../handlers/skip.js";
import { handleSnooze, handleCustomSnooze } from "../handlers/snooze.js";
import { YES_LABEL, NO_LABEL, SNOOZE_LABEL, INTRO_PROMPT, SNOOZE_PROMPT, snoozeActionRow } from "../buttons/buttonConstants.js";

// Handle all button interactions
const onInteractionCreate = async (interaction, db, client) => {
    switch (interaction.customId) {
        case "yes":
            await buttonSelectResponse(interaction, YES_LABEL, INTRO_PROMPT);
            await handleUserStandup(interaction, db, client);
            break;

        case "snooze":
            await buttonSelectResponse(interaction, SNOOZE_LABEL, INTRO_PROMPT);
            await interaction.user.send(message(SNOOZE_PROMPT, snoozeActionRow));
            break;

        case "no":
            await buttonSelectResponse(interaction, NO_LABEL, INTRO_PROMPT);
            await handleSkip(client, interaction);
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
}

export { onInteractionCreate };