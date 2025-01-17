import { INTRO_PROMPT, introActionRow } from "../buttons/buttonConstants.js";
import { message } from "../buttons/buttonInteraction.js";

const initDb = async (db) => {
    // Create both tables if they don't exist
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
}

const msgServerUsers = async (guild, db) => {
    try {
        // Get all server members
        const members = await guild.members.fetch();

        // Send dm to all users
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
}

export { initDb, msgServerUsers };