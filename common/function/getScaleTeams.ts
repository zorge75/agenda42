const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchUserWithRetry = async (userId: number, retries: any, token: any, lazyMode: boolean) => {
    const userCache: Map<number, any> = new Map(); // Cache for user data

    if (lazyMode && userCache.has(userId)) {
        return userCache.get(userId); // Return cached result
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`/api/get_user?id=${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 429 || !response.ok) {
                const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.log(`Rate limited for user ${userId}, waiting ${waitTime}ms`);
                await delay(waitTime);
                continue;
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

class RequestQueue {
    private queue: Array<() => Promise<any>> = [];
    private lastRequestTime = 0;
    private minDelay = 2000; // Minimum 2 seconds between requests

    async enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const now = Date.now();
                    const timeSinceLast = now - this.lastRequestTime;
                    if (timeSinceLast < this.minDelay) {
                        await delay(this.minDelay - timeSinceLast);
                    }
                    const result = await task();
                    this.lastRequestTime = Date.now();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.queue.shift();
                    this.processNext();
                }
            });
            if (this.queue.length === 1) {
                this.processNext();
            }
        });
    }

    private processNext() {
        if (this.queue.length > 0) {
            this.queue[0]();
        }
    }
}

const requestQueue = new RequestQueue();

export const fetchUsersBatch = async (userIds: number[], token: string, retries = 3) => {
    return requestQueue.enqueue(async () => {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Fetching batch of ${userIds.length} users, attempt ${i + 1}/${retries}`);
                const response = await fetch(`/api/get_user?filter=${userIds.join(',')}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter
                        ? parseInt(retryAfter) * 1000
                        : Math.min(Math.pow(2, i) * 2000, 10000); // Cap at 10s
                    console.log(`429 received, waiting ${waitTime}ms`);
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`Batch fetch failed with status: ${response.status}`);
                }

                const data = await response.json();
                console.log(`Successfully fetched batch of ${userIds.length} users`);
                return data;
            } catch (error) {
                console.error(`Batch fetch attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                await delay(Math.min(Math.pow(2, i) * 2000, 10000));
            }
        }
        throw new Error('Max retries reached for batch fetch');
    });
};

export const getScaleTeams = async (data: any, token: any) => {
    const arrayUsers: any[] = [];
    let sortedData = Object.isFrozen(data) ? [...data] : data; // Fixed 'flintred' typo
    let filtred = sortedData.filter((i: any) => i.scale_team).sort((a: any, b: any) =>
        new Date(b.begin_at).getTime() - new Date(a.begin_at).getTime()
    );

    const getUserFromLocalStorage = (userId: string | number) => {
        const cached = localStorage.getItem(`user_${userId}`);
        return cached ? JSON.parse(cached) : null;
    };

    const saveUserToLocalStorage = (userId: string | number, userData: any) => {
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
    };

    const usersToFetch: Set<number> = new Set();
    const cachedUsers: Map<number, any> = new Map();

    for (const i of filtred) {
        if (i.scale_team?.correcteds) {
            for (const a of (i.scale_team.correcteds || [])) {
                const userData = getUserFromLocalStorage(a.id);
                if (userData) {
                    cachedUsers.set(a.id, userData);
                } else {
                    usersToFetch.add(a.id);
                }
            }
        }
    }

    let fetchedUsers: any[] = [];
    if (usersToFetch.size > 0) {
        try {
            const userIds = Array.from(usersToFetch);
            const batchSize = 20;
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const batchResults = await fetchUsersBatch(batch, token);
                fetchedUsers = fetchedUsers.concat(batchResults);
                batchResults.forEach((user: any) => saveUserToLocalStorage(user.id, user));
            }
        } catch (error) {
            console.error('Failed to fetch all batches:', error);
        }
    }

    for (const i of filtred) {
        if (i.scale_team?.correcteds) {
            for (const a of (i.scale_team.correcteds || [])) {
                let userData = cachedUsers.get(a.id) || fetchedUsers.find((u: any) => u.id === a.id);
                if (userData) {
                    console.log("arrayUsers", arrayUsers);
                    console.log("userData", userData);
                    arrayUsers.push({
                        login: a.login,
                        id: a.id,
                        url: a.url,
                        image: userData.image.versions.small,
                        pool_month: userData.pool_month,
                        pool_year: userData.pool_year,
                        location: userData.location,
                        usual_full_name: userData.usual_full_name,
                        // grade: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].grade,
                        // level: userData.cursus_users.filter((i: any) => i.cursus_id === 21)[0].level,
                    });
                }
            }
        }
    }

    const uniqueScaleUsers = arrayUsers.reduce((acc: any[], u: any) => {
        if (!acc.some((user: any) => user.id === u.id)) acc.push(u);
        return acc;
    }, []);

    console.log("Processed users:", uniqueScaleUsers.length);
    return uniqueScaleUsers;
};