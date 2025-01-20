import { REST, Routes } from 'discord.js';

// Register slash commands
const registerCommands = async() => {

    // New commands should go here!
    const commands = [
        {
            name: 'checkin',
            description: 'Check in for the daily standup',
        }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Registering commands...');

        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID),
            { body: commands },
        );

        console.log('Successfully registered commands!');
    } catch (error) {
        console.error(`Error with initiating slash commands: ${error}`);
    }
}

export { registerCommands };