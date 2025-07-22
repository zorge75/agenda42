// Select three random users from a list of 15 or more people, sorted alphabetically,
// ensuring that the selection remains consistent across page reloads by using the sum of user IDs
// as a seed since they are unique. 
// 
// The solution should minimize the risk of stalking by making it
// difficult to manipulate the selection to include a specific user.

// Простая хэш-функция для создания seed из суммы ID
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Преобразование в 32-битное целое число
    }
    return Math.abs(hash);
}

// Функция для генерации псевдослучайных чисел с фиксированным seed
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function getRandomProtection(friends: { id: number; name: string }[]): { id: number; name: string }[] {
    const seed = simpleHash(friends.reduce((sum, friend) => sum + friend.id, 0).toString());
    const random = mulberry32(seed);

    const shuffled = [...friends];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3);
}
