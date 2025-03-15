import axios from "axios";
// import NodeCache from "node-cache";

// const cache = new NodeCache({ stdTTL: 300 }); // 5-min cache

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * Math.pow(2, i);
            console.log(`Rate limited. Retrying in ${waitTime}ms...`);
            await delay(waitTime);
            continue;
        }
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response;
    }
    throw new Error('Max retries exceeded');
};

export default async function handler(req: any, res: any) {
    try {
        const { id } = req.query;
        const cookies = req.headers.cookie || "";
        const cookieObj = Object.fromEntries(cookies.split("; ").map((c: string) => c.split("=")));
        const token = cookieObj["token"];

        if (!token) return res.status(401).json({ message: "No token" });

        // const cacheKey = `user_data_${id}`;
        // const cached = cache.get(cacheKey);
        // if (cached) return res.status(200).json(cached);

        const [evaluationsRes, slotsRes, eventsRes, userRes] = await Promise.all([
            fetchWithRetry('https://api.intra.42.fr/v2/me/scale_teams', {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetchWithRetry('https://api.intra.42.fr/v2/me/slots', {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetchWithRetry(`https://api.intra.42.fr/v2/users/${id}/events?sort=-begin_at`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`https://api.intra.42.fr/v2/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        const [evaluationsJson, slotsJson, eventsJson] = await Promise.all([
            evaluationsRes.json(),
            slotsRes.json(),
            eventsRes.json()
        ]);

        const responseData = {
            user: userRes.data,
            evaluations: evaluationsJson,
            slots: slotsJson,
            events: eventsJson,
            cookies: cookieObj
        };

        res.status(200).json(responseData);

    } catch (error: any) {
        console.error('Error in handler:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error'
        });
    }
}