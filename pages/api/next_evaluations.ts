import db from "../../lib/sqlite";

export default function handler(req, res) {
    if (req.method === "POST") {
        const { id_event, begin_at, end_at, chat_id, location, id_corrected } = req.body;

        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS evaluations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_event TEXT NOT NULL,
                    begin_at TEXT NOT NULL,
                    end_at TEXT NOT NULL,
                    chat_id TEXT,
                    location TEXT,
                    id_corrected TEXT
                )
            `);

            const checkStmt = db.prepare('SELECT COUNT(*) as count FROM evaluations WHERE id_event = ?');
            const { count } = checkStmt.get(id_event);

            if (count > 0) {
                res.status(409).json({ status: "EXISTS", message: "Event ID already exists" });
            } else {
                const insertStmt = db.prepare("INSERT INTO evaluations (id_event, begin_at, end_at, chat_id, location, id_corrected) VALUES (?, ?, ?, ?, ?, ?)");
                insertStmt.run(id_event, begin_at, end_at, chat_id, location, id_corrected);
                res.status(201).json({ status: "CREATED", message: "Evaluation created" });
            }
        } catch (err) {
            res.status(500).json({ status: "ERROR", message: "Error saving evaluation", error: err.message });
        }
    } else if (req.method === "GET") {
        try {
            const rows = db.prepare("SELECT * FROM evaluations").all();
            res.status(200).json(rows);
        } catch (err) {
            res.status(500).json({ message: "Error fetching evaluations", error: err.message });
        }
    } else if (req.method === "DELETE") {
        const { id } = req.body;
        try {
            db.prepare("DELETE FROM evaluations WHERE id = ?").run(id);
            res.status(200).json({ message: "Evaluation deleted" });
        } catch (err) {
            res.status(500).json({ message: "Error deleting evaluation", error: err.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}