import db from "../../lib/sqlite";

export default function handler(req, res) {
    if (req.method === "POST") {
        const { name, eventStart, eventEnd, reminderTime, chatId } = req.body;
        console.log("Received POST request:", { name, eventStart, eventEnd, reminderTime, chatId });

        try {
            const stmt = db.prepare("INSERT INTO events (name, eventStart, eventEnd, reminderTime, chatId) VALUES (?, ?, ?, ?, ?)");
            stmt.run(name, eventStart, eventEnd, reminderTime, chatId);
            console.log("Event inserted successfully");
            res.status(201).json({ message: "Event created" });
        } catch (err) {
            console.error("Error inserting event:", err.message);
            res.status(500).json({ message: "Error saving event", error: err.message });
        }
    } else if (req.method === "GET") {
        try {
            const rows = db.prepare("SELECT * FROM events").all();  // Return all events
            res.status(200).json(rows);
        } catch (err) {
            console.error("Error fetching events:", err.message);
            res.status(500).json({ message: "Error fetching events", error: err.message });
        }
    } else if (req.method === "DELETE") {
        const { id } = req.body;
        try {
            db.prepare("DELETE FROM events WHERE id = ?").run(id);
            res.status(200).json({ message: "Event deleted" });
        } catch (err) {
            console.error("Error deleting event:", err.message);
            res.status(500).json({ message: "Error deleting event", error: err.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}