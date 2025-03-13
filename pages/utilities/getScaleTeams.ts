export const getScaleTeams = async (data: any, token: any) => {
    const arrayUsers: any[] = [];
    const userCache: Map<number, any> = new Map(); // Cache for user data
    let sortedData = Object.isFrozen(data) ? [...data] : data;
    let filtred = sortedData.filter((i: any) => i.scale_team);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchUserWithRetry = async (userId: number, retries = 3) => {
        if (userCache.has(userId)) {
            return userCache.get(userId); // Return cached result
        }

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(`https://aron.agenda42.fr/api/get_user?id=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
                    console.log(`Rate limited for user ${userId}, waiting ${waitTime}ms`);
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`Fetch failed with status: ${response.status}`);
                }

                const userData = await response.json();
                userCache.set(userId, userData);
                return userData;
            } catch (error) {
                console.error(`Error fetching user ${userId}:`, error);
                if (i === retries - 1) throw error; // Last retry failed
                await delay(1000); // Wait before next retry
            }
        }
    };

    for (const i of filtred) {
        if (i.scale_team?.correcteds) {
            for (const a of i.scale_team.correcteds) {
                const userData = await fetchUserWithRetry(a.id);
                if (userData) {
                    console.log(a.login, userData);
                    arrayUsers.push({
                        login: a.login,
                        id: a.id,
                        url: a.url, // TODO: Add date of correction
                        image: userData.image.versions.medium,
                        pool_month: userData.pool_month,
                        pool_year: userData.pool_year,
                        usual_full_name: userData.usual_full_name,
                        grade: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].grade,
                        level: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].level,
                    });
                }
                await delay(250); // Base delay between requests
            }
        }
    }

    return arrayUsers;
}