export const getScaleTeams = async (data: any, token: any) => {
    const arrayUsers: any[] = [];
    const userCache: Map<number, any> = new Map(); // Cache for user data
    let sortedData = Object.isFrozen(data) ? [...data] : data;
    let filtred = sortedData.filter((i: any) => i.scale_team).sort((a: any, b: any) =>
              new Date(b.begin_at).getTime() - new Date(a.begin_at).getTime()
            ).slice(0, 9);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const getUserFromLocalStorage = (userId: string | number) => {
        const cached = localStorage.getItem(`user_${userId}`);
        return cached ? JSON.parse(cached) : null;
    };

    // Utility function to save user to localStorage
    const saveUserToLocalStorage = (userId: string | number, userData: any) => {
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
    };

    const fetchUserWithRetry = async (userId: number, retries = 3) => {
        if (userCache.has(userId)) {
            return userCache.get(userId); // Return cached result
        }

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(`/api/get_user?id=${userId}`, {
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
            for (const a of (i.scale_team.correcteds || [])) {
                // Check localStorage first
                let userData = getUserFromLocalStorage(a.id);

                if (userData) { // TODO: make lication without images
                    // If not in localStorage, fetch with retry
                    userData = await fetchUserWithRetry(a.id);
                    if (userData) {
                        // Save to localStorage after fetching
                        saveUserToLocalStorage(a.id, userData);
                    }
                }

                if (userData) {
                    arrayUsers.push({
                        login: a.login,
                        id: a.id,
                        url: a.url, // TODO: Add date of correction
                        image: userData.image.versions.small,
                        pool_month: userData.pool_month,
                        pool_year: userData.pool_year,
                        location: userData.location,
                        usual_full_name: userData.usual_full_name,
                        grade: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].grade,
                        level: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].level,
                    });
                }

                await delay(250); // Base delay between requests (even for cached data, if desired)
            }
        }
    }

    const uniqueScaleUsers = arrayUsers.reduce((acc: any[], u: any) => {
        if (!acc.some((user: any) => user.id === u.id)) {
            acc.push(u);
        }
        return acc;
    }, []);

    return uniqueScaleUsers;
}
