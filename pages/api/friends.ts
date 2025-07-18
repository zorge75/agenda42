import db from "../../lib/sqlite";

export default function handler(req, res) {
    if (req.method === "POST") {
        const { user_id, friend_id, friend_login, friend_name } = req.body;

        try {
            db.exec(`
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            friend_id TEXT NOT NULL,
            friend_login TEXT NOT NULL,
            friend_name TEXT NOT NULL
        )
    `);

            // Check if the user already exists in the settings table
            const checkStmt = db.prepare('SELECT * FROM friends WHERE user_id = ?');
            // const existingUser = checkStmt.get(user_id);

            // Insert the event into the settings table
            const insertStmt = db.prepare("INSERT INTO friends (user_id, friend_id, friend_login, friend_name) VALUES (?, ?, ?, ?)");
            insertStmt.run(user_id, friend_id, friend_login, friend_name);

            // Return success response
            res.status(201).json({ status: "CREATED", message: "Evaluation created" });
        } catch (err) {
            // Handle any errors during database operations
            res.status(500).json({ status: "ERROR", message: "Error saving evaluation", error: err.message });
        }
    } else if (req.method === "GET") {
        const { user_id } = req.query;
        try {
            // Retrieve user settings by user_id
            const checkStmt = db.prepare('SELECT * FROM friends WHERE user_id = ?');
            const userSettings = checkStmt.all(parseInt(user_id, 10));

            if (userSettings) {
                res.status(200).json({
                    status: "SUCCESS",
                    message: "User settings found",
                    data: userSettings
                });
            } else {
                res.status(200).json({
                    status: "NOT_FOUND",
                    message: "User settings not found",
                    data: null,
                });
            }
        } catch (err) {
            res.status(200).json({
                status: "NOT_FOUND",
                message: "User settings not found",
                data: null,
            });
        }
    } else if (req.method === "PUT" || req.method === "PATCH") {
        const { user_id, friend_id, friend_login, friend_name } = req.body;

        try {
            // Check if the user exists
            const checkStmt = db.prepare('SELECT * FROM friends WHERE user_id = ?');
            const existingUser = checkStmt.get(user_id);

            if (existingUser) {
                // Update the existing user's settings
                const updateStmt = db.prepare(`
                    UPDATE friends
                    SET view_default = ?, theme_default = ?, chat_id = ?
                    WHERE user_id = ?
                `);
                updateStmt.run(friend_id, friend_login, friend_name, user_id);

                res.status(200).json({
                    status: "UPDATED",
                    message: "User settings updated",
                    data: {
                        user_id,
                        friend_id,
                        friend_login,
                        friend_name
                    }
                });
            } else {
                // If user doesn't exist, return an error
                res.status(404).json({
                    status: "NOT_FOUND",
                    message: "User ID not found"
                });
            }
        } catch (err) {
            // Handle any errors during the update process
            res.status(500).json({ status: "ERROR", message: "Error updating user settings", error: err.message });
        }
    } else if (req.method === "DELETE") {
        // const { id } = req.body;
        // try {
        //     db.prepare("DELETE FROM evaluations WHERE id = ?").run(id);
        //     res.status(200).json({ message: "Evaluation deleted" });
        // } catch (err) {
        //     res.status(500).json({ message: "Error deleting evaluation", error: err.message });
        // }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
