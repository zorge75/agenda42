export async function getUserSettings(userId: any): Promise<void> {
    if (!userId) return;
    try {
        const response = await fetch(`/api/settings?user_id=${userId}`, {
            method: "GET",
        });

        if (!response.ok) {
            console.log(`Failed to fetch evaluation for user ${userId}: ${response}`);
            return;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching evaluation:", error instanceof Error ? error.message : "Unknown error");
        throw error;
    }
}