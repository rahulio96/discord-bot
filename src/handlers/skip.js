import { blue, grey } from "../constants/colors.js";

const handleSkip = async (client, interaction) => {
    await interaction.user.send({
        content: `Skipping today's standup, see you tomorrow!`,
    });
    await client.channels.cache.get(process.env.CHANNEL_ID).send({
        content: "Daily Standup Check-In:",
        embeds: [{
            author: {
                name: interaction.user.displayName,
                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
            },
            color: grey,
        }, {
            title: ":giraffe: Skipped Today's Standup",
            color: blue,
        }],
    });
}

export { handleSkip };