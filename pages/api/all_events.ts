import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount: any) => Math.pow(2, retryCount) * 1000, // exponential backoff
    retryCondition: (error: any) => error.response?.status === 429,
});

export default async function handler(req: any, res: any) {
    const { id } = req.query;
    const cookies = req.headers.cookie || "";
    const cookieObj = cookies
        ? Object.fromEntries(cookies.split("; ").map((c: any) => c.split("=")))
        : {};
    const tokenFromCookie = cookieObj["token"];
    try {
        const response = await axios.get(
            "https://api.intra.42.fr/v2/campus/" + id + "/events?page[size]=100&sort=-created_at",
            {
                headers: {
                    Authorization: `Bearer ${tokenFromCookie}`,
                },
            },
        );
        res.status(200).json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        let message = error.response?.data?.error || "Internal server error";
        res.status(status).json({ message });
    }
}
