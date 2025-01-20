import { introActionRow, INTRO_PROMPT } from "../buttons/buttonConstants.js";
import { message } from "../buttons/buttonInteraction.js";

// Handle all slash commands
const handleCommands = async (interaction, db) => {
    switch (interaction.commandName) {
        // New commands go here!
        case "checkin":
            try {
                db.prepare(
                    `INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)`
                ).run(interaction.user.id, interaction.user.globalName);

                interaction.user.send(message(INTRO_PROMPT, introActionRow));
                interaction.reply(
                    {
                        content: "You will now receive a standup prompt!", 
                        ephemeral: true
                    }
                );

            } catch (error) {
                console.log(`Unable to send standup to ${interaction.user.tag}: ${error}`);
            }
        break;
    }
}

export { handleCommands };