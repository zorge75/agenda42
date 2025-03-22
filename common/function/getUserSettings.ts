export async function getUserSettings(userId: any): Promise<void> {
    if (!userId) return;
    try {
        const response = await fetch(`/api/settings?user_id=${userId}`, {
            method: "GET",
        });

        if (!response.ok) {
            console.log(`Failed to fetch evaluation for user ${userId}: ${response}`);
            return ("null");
        }

        const data = await response.json();
        console.log("Fetched evaluation data:", data);
        return data;
    } catch (error) {
        console.error("Error fetching evaluation:", error instanceof Error ? error.message : "Unknown error");
        throw error;
    }
}