import React from 'react';
import '../styles/styles.scss';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'react-jss';
import { ToastContainer } from 'react-toastify';
import { ReactNotifications } from 'react-notifications-component';
import { AuthContextProvider } from '../context/authContext';
import { ThemeContextProvider } from '../context/themeContext';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import Portal from '../layout/Portal/Portal';
import Wrapper from '../layout/Wrapper/Wrapper';
import App from '../layout/App/App';
import { ToastCloseButton } from '../components/bootstrap/Toasts';
import StoreProvider from '../storeProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/userSlice';
import { setEvals } from '../store/slices/evalsSlice';
import { setSlots, setOriginalSlots, setDefances, setDefancesHistory } from '../store/slices/slotsSlice';
import { setEvents } from '../store/slices/eventsSlice';
import { preparationSlots } from '../common/function/preparationSlots';
import { getNextEvaluation } from '../common/function/getNextEvaluation';

interface AppPropsCustom extends AppProps {
	token: string,
	me: any,
	evals: any,
	events: any,
	slots: any,
	asCorected: any,
	defances: any,
	defancesHistory: any,
}

const MyApp = ({ Component, pageProps, token, me, evals, slots, events, defances, defancesHistory }: AppPropsCustom) => {
	getOS();
	const dispatch = useDispatch();

	React.useEffect(() => {
		if (me)
			dispatch(setUser(me));
		if (evals)
			dispatch(setEvals(evals));
		if (slots) {
			const preparedSlots = preparationSlots(slots);
			getNextEvaluation(preparedSlots);
			dispatch(setOriginalSlots(slots));
			dispatch(setSlots(preparedSlots));
		}
		if (defances) {
			dispatch(setDefances(defances)); // TODO: add duration + begin_at for end_at
		}
		if (defancesHistory) {
			dispatch(setDefancesHistory(defancesHistory));
		}
		if (events)
			dispatch(setEvents(events));
	}, [me, dispatch]);

	/**
	 * Dark Mode
	 */
	const { themeStatus } = useDarkMode();
	const theme = {
		theme: themeStatus,
		primary: COLORS.PRIMARY.code,
		secondary: COLORS.SECONDARY.code,
		success: COLORS.SUCCESS.code,
		info: COLORS.INFO.code,
		warning: COLORS.WARNING.code,
		danger: COLORS.DANGER.code,
		dark: COLORS.DARK.code,
		light: COLORS.LIGHT.code,
	};

	return (
		<AuthContextProvider initialToken={token} me={me}>
			<ThemeContextProvider>
				<ThemeProvider theme={theme}>
					<App>
						<Wrapper>
							{/* eslint-disable-next-line react/jsx-props-no-spreading */}
							<StoreProvider >
								<Component {...pageProps} />
							</StoreProvider>
						</Wrapper>
					</App>
					<Portal id='portal-notification'>
						<ReactNotifications />
					</Portal>
					<ToastContainer
						closeButton={ToastCloseButton}
						toastClassName='toast show'
					/>
				</ThemeProvider>
			</ThemeContextProvider>
		</AuthContextProvider>
	);
};

const AppWithRedux = (props: AppPropsCustom, cookies: any) => (
	<StoreProvider>
		<MyApp {...props} {...cookies} />
	</StoreProvider>
);



const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithThrottle(url: string, options: any, retries = 3, delayMs = 2000): Promise<any> {
	for (let i = 0; i < retries; i++) {
		try {
			// Direct URL instead of proxy
			const response = await fetch(url, {
				method: options.method || "GET",
				headers: {
					...options.headers,
					"Content-Type": "application/json",
				},
				body: options.body ? JSON.stringify(options.body) : undefined,
			});

			console.log(`Fetch ${url}: Status ${response.status}`);
			// Log rate limit headers
			console.log("Rate-Limit Headers:", {
				limit: response.headers.get("X-RateLimit-Limit"),
				remaining: response.headers.get("X-RateLimit-Remaining"),
				reset: response.headers.get("X-RateLimit-Reset"),
			});

			const contentType = response.headers.get("content-type") || "";
			let data;

			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				data = await response.text();
				console.log(`Non-JSON response from ${url}:`, data);
			}

			if (!response.ok) {
				if (response.status === 429) {
					const resetTime = response.headers.get("X-RateLimit-Reset");
					const waitTime = resetTime ? (parseInt(resetTime) * 1000 - Date.now()) : delayMs;
					console.log(`Rate limit hit for ${url}, waiting ${waitTime}ms...`);
					await new Promise((res) => setTimeout(res, waitTime));
					continue;
				}
				throw new Error(data.error || `Fetch failed: ${response.statusText}`);
			}

			return data;
		} catch (error) {
			if (i < retries - 1) {
				console.log(`Retrying ${url} (${i + 1}/${retries})`);
				await new Promise((res) => setTimeout(res, delayMs));
				continue;
			}
			throw error;
		}
	}
}

// Placeholder for token refresh (replace with actual implementation)
const refreshToken = async (cookies: Record<string, string>): Promise<string | null> => {
	console.warn('Token refresh not implemented. Returning null.');
	// Example: const res = await fetch('https://api.intra.42.fr/oauth/token', { ... });
	// return res.ok ? await res.json().access_token : null;
	return null;
};

AppWithRedux.getInitialProps = async (appContext) => {
	const { Component, ctx } = appContext;
	console.log("Running on:", ctx.req ? "server" : "client");
	const { req, res, pathname } = ctx;

	// Log or inspect the current path
	console.log('Current pathname:', pathname);

	const cookies = ctx.req?.headers.cookie
		? Object.fromEntries(
			ctx.req.headers.cookie.split('; ').map((cookie: string) => {
				const [key, value] = cookie.split('=');
				return [key, value];
			})
		)
		: {};
	console.log("Cookies:", cookies);

	let token = cookies.token;
	if (!token) {
		console.error('No token found in cookies');
		return { cookies };
	}

	let headers = { Authorization: `Bearer ${token}` };

	try {
		// Sequential fetching with delay
		const delayBetweenRequests = 250; // 2 seconds between each request
		let meJson = await fetchWithThrottle("https://api.intra.42.fr/v2/me", { headers, method: "GET" }, 3, delayBetweenRequests);

		const endpoints = [
			{ url: "https://api.intra.42.fr/v2/me/scale_teams", key: "evals" },
			{ url: `https://api.intra.42.fr/v2/me/slots?${new URLSearchParams({ "page[size]": "100" })}`, key: "slots" },
			{ url: "https://api.intra.42.fr/v2/me/scale_teams?filter[future]=false", key: "defances" },
			{ url: `https://api.intra.42.fr/v2/users/${meJson.id}/events?sort=-begin_at`, key: "events" },
			{ url: `https://api.intra.42.fr/v2/users/${meJson.id}/scale_teams/as_corrected`, key: "defancesHistory" },
		];

		const results: any = {};
		for (const { url, key } of endpoints) {
			try {
				results[key] = await fetchWithThrottle(url, { headers, method: "GET" }, 3, delayBetweenRequests);
				await new Promise((res) => setTimeout(res, delayBetweenRequests)); // Delay between requests
			} catch (err) {
				console.error(`${key} fetch failed:`, err);
				results[key] = null; // Fallback to null on error
			}
		}

		console.log("All fetches completed successfully");

		let pageProps = {};
		if (Component.getInitialProps) {
			pageProps = await Component.getInitialProps(ctx);
		}

		return {
			cookies,
			me: meJson,
			evals: results.evals,
			slots: results.slots,
			events: results.events,
			defances: results.defances,
			defancesHistory: results.defancesHistory,
		};
	} catch (error) {
		console.error('getInitialProps failed:', error);
		if (error.message === 'Unauthorized' && ctx.res) {
			// Optional: Redirect to login page
			console.warn('Redirecting to login due to persistent unauthorized error');
			ctx.res.writeHead(302, { Location: '/login' });
			ctx.res.end();
		}
		return { cookies }; // Fallback to minimal data
	}
};

export default AppWithRedux;
