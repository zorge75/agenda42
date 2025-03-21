// pages/api/proxy/post.js
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    const { url } = req.query;
    const token = req.headers.authorization;
    const body = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL query parameter is required" });
    }

    try {
        const response = await fetch(url as string, {
            method: "POST",
            headers: {
                Authorization: token || "",
                "Content-Type": req.headers["content-type"] || "application/json",
                "User-Agent": "Next.js App",
            },
            body: typeof body === "object" ? JSON.stringify(body) : body,
        });

        // Check Content-Type to determine how to parse the response
        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text(); // Fallback to text for non-JSON responses
            console.log(`Non-JSON response from ${url}:`, data);
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: `API Error: ${response.statusText}`,
                status: response.status,
                details: data,
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("POST Proxy Error:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}