import dayjs from "dayjs";

export function test() {
	return null;
}

export function getOS() {
	// @ts-ignore
	const { userAgent } = typeof window !== 'undefined' && window.navigator;
	// @ts-ignore
	const { platform } = typeof window !== 'undefined' && window.navigator;
	const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
	let os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
		os = 'MacOS';
	} else if (iosPlatforms.indexOf(platform) !== -1) {
		os = 'iOS';
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
		os = 'Windows';
	} else if (/Android/.test(userAgent)) {
		os = 'Android';
	} else if (!os && /Linux/.test(platform)) {
		os = 'Linux';
	}

	// @ts-ignore
	typeof document !== 'undefined' && document.documentElement.setAttribute('os', os);
	return os;
}

export const hasNotch = () => {
	/**
	 * For storybook test
	 */
	const storybook =
		typeof window !== 'undefined' ? window.location !== window.parent.location : '';
	// @ts-ignore
	const iPhone =
		typeof window !== 'undefined'
			? // @ts-ignore
			/iPhone/.test(navigator.userAgent) && !window?.MSStream
			: '';
	const aspect = typeof window !== 'undefined' ? window.screen.width / window.screen.height : 0;
	const aspectFrame = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 0;
	return (
		(iPhone && aspect.toFixed(3) === '0.462') ||
		(storybook && aspectFrame.toFixed(3) === '0.462')
	);
};

export const mergeRefs = (refs: any[]) => {
	return (value: any) => {
		refs.forEach((ref) => {
			if (typeof ref === 'function') {
				ref(value);
			} else if (ref != null) {
				ref.current = value;
			}
		});
	};
};

export const randomColor = () => {
	const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger'];

	const color = Math.floor(Math.random() * colors.length);

	return colors[color];
};

export const priceFormat = (price: number) => {
	return price?.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
	});
};

export const average = (array: any[]) => array.reduce((a, b) => a + b) / array.length;

export const percent = (value1: number, value2: number) =>
	Number(((value1 / value2 - 1) * 100).toFixed(2));

export const getFirstLetter = (text: string, letterCount = 2): string =>
	// @ts-ignore
	text
		.toUpperCase()
		.match(/\b(\w)/g)
		.join('')
		.substring(0, letterCount);

export const debounce = (func: (arg0: any) => void, wait = 1000) => {
	let timeout: string | number | NodeJS.Timeout | undefined;

	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			// @ts-ignore
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

export const pathRetouch = (path?: string): string => {
	if (path === '/') return '/';
	return `/${path}`;
};

export const pathToRoute = (path: string): string => {
	if (path === '/') return '/';
	if (path?.length > 1 && path?.substring(1, 0) === '/') return path?.substring(1, path?.length);
	return path;
};


export const isTilePast = (tileDate: string): any => {
	return dayjs(tileDate).isBefore(dayjs());
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isMyPiscine = (me: any, user: any): boolean => {
	if (!me || !user)
		return false;
	if (user.pool_month === me.pool_month && user.pool_year === me.pool_year)
		return true;
	return false;
};

export const userInIntraHandler = async (id: string) => {
	window.open(`https://profile.intra.42.fr/users/${id}`, "_blank");
}

export const getName = (me: any) => {
	return (me.usual_first_name || me.first_name);
}

export const getMaxPage = (str: string): number => {
	if (!str)
		return 0;
	const regex = /page=(\d+)/g;
	const matches = [...str?.matchAll(regex)];
	const pageNumbers = matches.map(match => parseInt(match[1]));
	return (pageNumbers[0]);
}

export const alphabeticSort = (array: any, key: string) => {
	return [...array].sort((a, b) => {
		if (a[key] > b[key]) return 1;
		if (a[key] < b[key]) return -1;
		return 0;
	})
}

export const pinSort = <T extends { friend_id: string | number }>(
	array: T[],
	pins: (string | number)[]
): T[] => {
	if (!pins || pins.length === 0) return [...array];

	return [...array].sort((a, b) => {
		const aIsPinned = pins.includes(a.friend_id);
		const bIsPinned = pins.includes(b.friend_id);

		if (aIsPinned && !bIsPinned) return -1;
		if (!aIsPinned && bIsPinned) return 1;
		return 0; 
	});
  };