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

const fetchWithRetry = async (
	url: string,
	options: RequestInit,
	retries = 10,
	baseDelay = 500
): Promise<any> => {
	for (let attempt = 0; attempt < retries; attempt++) {
		console.log(`Attempting fetch: ${url}, attempt ${attempt + 1}/${retries}`);
		try {
			const response = await fetch(url, options);

			if (response.status === 401) {
				console.error(`401 Unauthorized for ${url}: Token expired`);
				throw new Error('Unauthorized'); // Exit immediately, no retries
			}

			if (response.status === 429) {
				const retryAfter = response.headers.get('Retry-After');
				let waitTime: number;

				if (retryAfter) {
					waitTime = Math.min(parseInt(retryAfter, 10) * 1000, 10000); // Cap at 10s
				} else {
					const backoff = baseDelay * Math.pow(2, attempt);
					const jitter = Math.random() * 50;
					waitTime = Math.min(backoff + jitter, 5000); // Cap at 5s
				}

				console.warn(`429 Too Many Requests for ${url} - Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
				await delay(waitTime);
				continue;
			}

			if (!response.ok) {
				const text = await response.text();
				console.error(`Fetch failed for ${url} with status: ${response.status}, body: ${text}`);
				throw new Error(`Fetch failed with status ${response.status}`);
			}

			console.log(`Fetch succeeded for ${url}`);
			return await response.json();
		} catch (error) {
			if (error.message === 'Unauthorized' || attempt === retries - 1) {
				console.error(`Exiting fetch for ${url}: ${error.message}`);
				throw error; // Exit on Unauthorized or max retries
			}
			console.log(`Retrying ${url} due to error: ${error.message}`);
		}
	}
	throw new Error(`Unexpected exit from retry loop for ${url}`); // Should never reach here
};

// Placeholder for token refresh (replace with actual implementation)
const refreshToken = async (cookies: Record<string, string>): Promise<string | null> => {
	console.warn('Token refresh not implemented. Returning null.');
	// Example: const res = await fetch('https://api.intra.42.fr/oauth/token', { ... });
	// return res.ok ? await res.json().access_token : null;
	return null;
};

AppWithRedux.getInitialProps = async ({ Component, ctx }: any) => {
	console.log('Starting getInitialProps');

	const cookies = ctx.req?.headers.cookie
		? Object.fromEntries(
			ctx.req.headers.cookie.split('; ').map((cookie: string) => {
				const [key, value] = cookie.split('=');
				return [key, value];
			})
		)
		: {};

	let token = cookies.token;
	if (!token) {
		console.error('No token found in cookies');
		return { cookies };
	}

	let headers = { Authorization: `Bearer ${token}` };

	try {
		// Fetch /me first (required for dependent fetches)
		let meJson;
		try {
			meJson = await fetchWithRetry('https://api.intra.42.fr/v2/me', { headers });
		} catch (error) {
			if (error.message === 'Unauthorized') {
				console.log('Token expired, attempting refresh');
				const newToken = await refreshToken(cookies);
				if (!newToken) {
					console.error('Token refresh failed');
					return { cookies };
				}
				token = newToken;
				headers = { Authorization: `Bearer ${token}` };
				meJson = await fetchWithRetry('https://api.intra.42.fr/v2/me', { headers });
			} else {
				throw error; // Rethrow other errors
			}
		}

		// Concurrent fetches for independent endpoints
		const fetchPromises = [
			fetchWithRetry('https://api.intra.42.fr/v2/me/scale_teams', { headers })
				.catch((err) => { console.error('Evaluations fetch failed:', err); throw err; }),
			fetchWithRetry(`https://api.intra.42.fr/v2/me/slots?${new URLSearchParams({ 'page[size]': '100' })}`, { headers })
				.catch((err) => { console.error('Slots fetch failed:', err); throw err; }),
			fetchWithRetry('https://api.intra.42.fr/v2/me/scale_teams?filter[future]=false', { headers }) // Could optimize by reusing evaluations
				.catch((err) => { console.error('Defances fetch failed:', err); throw err; }),
			fetchWithRetry(`https://api.intra.42.fr/v2/users/${meJson.id}/events?sort=-begin_at`, { headers })
				.catch((err) => { console.error('Events fetch failed:', err); throw err; }),
			fetchWithRetry(`https://api.intra.42.fr/v2/users/${meJson.id}/scale_teams/as_corrected`, { headers })
				.catch((err) => { console.error('Defances history fetch failed:', err); throw err; }),
		];

		const [
			evaluationsResponse,
			slotsResponse,
			defancesResponse,
			eventsResponse,
			defancesHistoryResponse,
		] = await Promise.all(fetchPromises);

		console.log('All fetches completed successfully');
		return {
			cookies,
			me: meJson,
			slots: slotsResponse,
			events: eventsResponse,
			evals: evaluationsResponse,
			defances: defancesResponse,
			defancesHistory: defancesHistoryResponse,
			token,
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
