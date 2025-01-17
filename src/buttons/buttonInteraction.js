// Message with embeded message and button(s)
function message(prompt, actionRow) {
    return {
        embeds: [{ description: prompt }],
        components: [actionRow],
    }
}

// If a user clicks a button, make the message with the buttons show the user' selected
// option (this is embedded) and remove all buttons
const buttonSelectResponse = async (interaction, selectedButtonText, originalBotResponse) => {
    await interaction.update({
        content: `> ${selectedButtonText}`,
        embeds: [{ description: originalBotResponse }],
        components: [],
    });
}

export { message, buttonSelectResponse };