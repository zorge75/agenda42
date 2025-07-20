import axios from "axios";

export default async function handler(req: any, res: any) {
    const { month, year, signSort, page } = req.query;
    const cookies = req.headers.cookie || "";
    const cookieObj = cookies
        ? Object.fromEntries(cookies.split("; ").map((c: any) => c.split("=")))
        : {};
    const tokenFromCookie = cookieObj["token"];
    const uri = "https://api.intra.42.fr/v2/cursus/9/users" 
        + `?page[number]=${page}`
        + `&filter[primary_campus_id]=1`
        + `&sort=${signSort}updated_at`
        + `&filter[pool_year]=${year}`
        + `&filter[pool_month]=${month}`;

    try {
        const response = await axios.get(
            uri,
            {
                headers: {
                    Authorization: `Bearer ${tokenFromCookie}`,
                },
            },
        );
        res.status(200).json({
            data: response.data,
            links: response.headers.link
        });
    } catch (error: any) {
        console.log(error);
        res.status(error.response?.status || 500).json({ message: error });
    }
}
