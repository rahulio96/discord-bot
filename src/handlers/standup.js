import { grey, blue, red } from '../constants/colors.js';

const formatDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

const handleUserStandup = async (interaction, db, client) => {
    const botFilter = response => {
        return response.author.id === interaction.user.id;
    }
    const messages = await interaction.channel.messages.fetch({ limit: 1 });
    const botMessage = messages.find(msg => msg.author.bot);

    // Get the user's last standup plan
    const userPlan = await db.prepare(
        `SELECT * FROM standup 
        WHERE user_id = ? 
        ORDER BY created_at 
        DESC LIMIT 1`
    ).get(interaction.user.id) || null;

    const curDate = new Date();
    const prevDate = userPlan ? new Date(userPlan.created_at) : curDate;

    // First msg depends on if it's the user's first time filling out a standup
    const firstMsg = userPlan ?
        (`Daily Standup check-in for ${formatDate.format(curDate)}` +
            `\n\nYour previous day plan (${formatDate.format(prevDate)}):` +
            `\n${userPlan.plan}` +
            "\n\n**What did you complete in the previous day?**")
        : (":wave: Welcome to your first standup! What are you planning on working on today?");

    let work = "";

    try {
        // Send the first message
        await interaction.user.send({
            content: firstMsg,
            ...(botMessage && { reply: { messageReference: botMessage.id } }),
        });
        
        // If it's NOT the user's first time, get thier previous day's work
        if (userPlan) {
            // Get previous day's work
            work = await interaction.channel.awaitMessages({
                max: 1,
                time: 0,
                errors: ['time'],
                filter: botFilter,
            });
            work = work.first().content;
            await interaction.user.send({content: "Great, what are you planning on working on today?"});
        }
        
        // Get plan for today
        const plan = await interaction.channel.awaitMessages({
            max: 1,
            time: 0,
            errors: ['time'],
            filter: botFilter,
        });
        
        await interaction.user.send({content: "Got it, do you have any blockers? If not, please say: `no`."});

        // Get blockers
        const blockers = await interaction.channel.awaitMessages({
            max: 1,
            time: 0,
            errors: ['time'],
            filter: botFilter,
        });

        const isNo = blockers.first().content.toLowerCase().trim() === "no";

        db.prepare(
            `INSERT INTO standup (user_id, work, plan, blockers) VALUES (?, ?, ?, ?)`
        ).run(interaction.user.id, work, plan.first().content, blockers.first().content);

        await interaction.user.send({content: "Thanks for completing your standup, please make sure to update your Jira task status appropriately. Have a nice day! :raised_hands:"});

        // Post standup in channel for server
        // Only post blockers if the user didn't type "no"
        // Only post previous day's work if it's not the user's first standup
        await client.channels.cache.get(process.env.CHANNEL_ID).send({
            content: "Daily Standup Check-In:",
            embeds: [{
                author: {
                    name: interaction.user.displayName,
                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                },
                color: grey,
            }, ...(userPlan ? [{
                title: ":calendar_spiral: Previous Day's Progress",
                description: work,
                color: blue,
            }] : []), {
                title: ":pencil: Today's Plan",
                description: plan.first().content,
                color: blue,
            }, ...(
                !isNo ? [{
                    title: ":fire: Blockers",
                    description: blockers.first().content,
                    color: red,
            }] : [])],
        });

    } catch (error) {
        console.log(error);
    }   
}

export { handleUserStandup };