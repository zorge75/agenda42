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
import { getUserSettings } from '../common/function/getUserSettings';
import { setSavedSettings } from '../store/slices/settingsReducer';

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
		let chat_id;
		if (me) {
			dispatch(setUser(me));
			getUserSettings(me.id).then((data: any) => {
				dispatch(setSavedSettings(data));
				console.log("Resolved Data:", data);
				chat_id = data?.data?.chat_id;
			}).catch((error) => {
				console.error("Error:", error);
			});;
		}
		if (evals)
			dispatch(setEvals(evals));
		if (slots) {
			const preparedSlots = preparationSlots(slots);
			getNextEvaluation(preparedSlots, chat_id);
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
		const delayBetweenRequests = 500; // 2 seconds between each request
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

		if (process.env.NODE_ENV !== 'production') {
			results.slots = [
				...results.slots,
				{
					"id": 785,
					"begin_at": "2025-03-22T21:15:00.000Z",
					"end_at": "2025-03-22T21:45:00.000Z",
					"scale_team": {
						"id": 7814334,
						"scale_id": 34880,
						"comment": null,
						"created_at": "2025-02-23T14:30:29.683Z",
						"updated_at": "2025-02-23T15:50:21.342Z",
						"feedback": null,
						"final_mark": null,
						"flag": {
							"id": 1,
							"name": "Ok",
							"positive": true,
							"icon": "check-4",
							"created_at": "2015-09-14T23:06:52.000Z",
							"updated_at": "2015-09-14T23:06:52.000Z"
						},
						"begin_at": "2025-02-23T15:45:00.000Z",
						"correcteds": [
							{
								"id": 189251,
								"login": "achaisne",
								"url": "https://api.intra.42.fr/v2/users/achaisne"
							},
							{
								"id": 202885,
								"login": "mcogne--",
								"url": "https://api.intra.42.fr/v2/users/mcogne--"
							}
						],
						"corrector": {
							"id": 177543,
							"login": "abergman",
							"url": "https://api.intra.42.fr/v2/users/abergman"
						},
						"truant": {
							"id": 177543,
							"login": "abergman",
							"url": "https://api.intra.42.fr/v2/users/abergman"
						},
						"filled_at": null,
						"questions_with_answers": []
					},
					"user": {
						"id": 177543,
						"email": "abergman@student.42.fr",
						"login": "abergman",
						"first_name": "Aron",
						"last_name": "Bergman",
						"usual_full_name": "Aron Bergman",
						"usual_first_name": null,
						"url": "https://api.intra.42.fr/v2/users/abergman",
						"phone": "hidden",
						"displayname": "Aron Bergman",
						"kind": "student",
						"image": {
							"link": "https://cdn.intra.42.fr/users/932073df2570926fdc1f927cb45f0dd5/abergman.jpg",
							"versions": {
								"large": "https://cdn.intra.42.fr/users/607ec2f60fdbda424b64808d611cf17d/large_abergman.jpg",
								"medium": "https://cdn.intra.42.fr/users/b451991403a62211e5d780221daaabc7/medium_abergman.jpg",
								"small": "https://cdn.intra.42.fr/users/ffd6439cd9fc47271fed6267900344e4/small_abergman.jpg",
								"micro": "https://cdn.intra.42.fr/users/612a1d0886c143ee8c656e269cb86b83/micro_abergman.jpg"
							}
						},
						"staff?": false,
						"correction_point": 7,
						"pool_month": "february",
						"pool_year": "2024",
						"location": "paul-f4Ar6s1",
						"wallet": 140,
						"anonymize_date": "2028-03-22T00:00:00.000+01:00",
						"data_erasure_date": "2028-03-22T00:00:00.000+01:00",
						"created_at": "2024-02-01T11:31:50.891Z",
						"updated_at": "2025-03-22T14:19:20.420Z",
						"alumnized_at": null,
						"alumni?": false,
						"active?": true
					},
					"slots_data": [
						{
							"id": 110429054,
							"begin_at": "2025-02-23T15:45:00.000Z",
							"end_at": "2025-02-23T16:00:00.000Z",
							"scale_team": {
								"id": 7814334,
								"scale_id": 34880,
								"comment": null,
								"created_at": "2025-02-23T14:30:29.683Z",
								"updated_at": "2025-02-23T15:50:21.342Z",
								"feedback": null,
								"final_mark": null,
								"flag": {
									"id": 1,
									"name": "Ok",
									"positive": true,
									"icon": "check-4",
									"created_at": "2015-09-14T23:06:52.000Z",
									"updated_at": "2015-09-14T23:06:52.000Z"
								},
								"begin_at": "2025-02-23T15:45:00.000Z",
								"correcteds": [
									{
										"id": 189251,
										"login": "achaisne",
										"url": "https://api.intra.42.fr/v2/users/achaisne"
									},
									{
										"id": 202885,
										"login": "mcogne--",
										"url": "https://api.intra.42.fr/v2/users/mcogne--"
									}
								],
								"corrector": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"truant": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"filled_at": null,
								"questions_with_answers": []
							},
							"user": {
								"id": 177543,
								"email": "abergman@student.42.fr",
								"login": "abergman",
								"first_name": "Aron",
								"last_name": "Bergman",
								"usual_full_name": "Aron Bergman",
								"usual_first_name": null,
								"url": "https://api.intra.42.fr/v2/users/abergman",
								"phone": "hidden",
								"displayname": "Aron Bergman",
								"kind": "student",
								"image": {
									"link": "https://cdn.intra.42.fr/users/932073df2570926fdc1f927cb45f0dd5/abergman.jpg",
									"versions": {
										"large": "https://cdn.intra.42.fr/users/607ec2f60fdbda424b64808d611cf17d/large_abergman.jpg",
										"medium": "https://cdn.intra.42.fr/users/b451991403a62211e5d780221daaabc7/medium_abergman.jpg",
										"small": "https://cdn.intra.42.fr/users/ffd6439cd9fc47271fed6267900344e4/small_abergman.jpg",
										"micro": "https://cdn.intra.42.fr/users/612a1d0886c143ee8c656e269cb86b83/micro_abergman.jpg"
									}
								},
								"staff?": false,
								"correction_point": 7,
								"pool_month": "february",
								"pool_year": "2024",
								"location": "paul-f4Ar6s1",
								"wallet": 140,
								"anonymize_date": "2028-03-22T00:00:00.000+01:00",
								"data_erasure_date": "2028-03-22T00:00:00.000+01:00",
								"created_at": "2024-02-01T11:31:50.891Z",
								"updated_at": "2025-03-22T14:19:20.420Z",
								"alumnized_at": null,
								"alumni?": false,
								"active?": true
							}
						},
						{
							"id": 110429059,
							"begin_at": "2025-02-23T16:00:00.000Z",
							"end_at": "2025-02-23T16:15:00.000Z",
							"scale_team": {
								"id": 7814334,
								"scale_id": 34880,
								"comment": null,
								"created_at": "2025-02-23T14:30:29.683Z",
								"updated_at": "2025-02-23T15:50:21.342Z",
								"feedback": null,
								"final_mark": null,
								"flag": {
									"id": 1,
									"name": "Ok",
									"positive": true,
									"icon": "check-4",
									"created_at": "2015-09-14T23:06:52.000Z",
									"updated_at": "2015-09-14T23:06:52.000Z"
								},
								"begin_at": "2025-02-23T15:45:00.000Z",
								"correcteds": [
									{
										"id": 189251,
										"login": "achaisne",
										"url": "https://api.intra.42.fr/v2/users/achaisne"
									},
									{
										"id": 202885,
										"login": "mcogne--",
										"url": "https://api.intra.42.fr/v2/users/mcogne--"
									}
								],
								"corrector": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"truant": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"filled_at": null,
								"questions_with_answers": []
							},
							"user": {
								"id": 177543,
								"email": "abergman@student.42.fr",
								"login": "abergman",
								"first_name": "Aron",
								"last_name": "Bergman",
								"usual_full_name": "Aron Bergman",
								"usual_first_name": null,
								"url": "https://api.intra.42.fr/v2/users/abergman",
								"phone": "hidden",
								"displayname": "Aron Bergman",
								"kind": "student",
								"image": {
									"link": "https://cdn.intra.42.fr/users/932073df2570926fdc1f927cb45f0dd5/abergman.jpg",
									"versions": {
										"large": "https://cdn.intra.42.fr/users/607ec2f60fdbda424b64808d611cf17d/large_abergman.jpg",
										"medium": "https://cdn.intra.42.fr/users/b451991403a62211e5d780221daaabc7/medium_abergman.jpg",
										"small": "https://cdn.intra.42.fr/users/ffd6439cd9fc47271fed6267900344e4/small_abergman.jpg",
										"micro": "https://cdn.intra.42.fr/users/612a1d0886c143ee8c656e269cb86b83/micro_abergman.jpg"
									}
								},
								"staff?": false,
								"correction_point": 7,
								"pool_month": "february",
								"pool_year": "2024",
								"location": "paul-f4Ar6s1",
								"wallet": 140,
								"anonymize_date": "2028-03-22T00:00:00.000+01:00",
								"data_erasure_date": "2028-03-22T00:00:00.000+01:00",
								"created_at": "2024-02-01T11:31:50.891Z",
								"updated_at": "2025-03-22T14:19:20.420Z",
								"alumnized_at": null,
								"alumni?": false,
								"active?": true
							}
						},
						{
							"id": 110429056,
							"begin_at": "2025-02-23T16:15:00.000Z",
							"end_at": "2025-02-23T16:30:00.000Z",
							"scale_team": {
								"id": 7814334,
								"scale_id": 34880,
								"comment": null,
								"created_at": "2025-02-23T14:30:29.683Z",
								"updated_at": "2025-02-23T15:50:21.342Z",
								"feedback": null,
								"final_mark": null,
								"flag": {
									"id": 1,
									"name": "Ok",
									"positive": true,
									"icon": "check-4",
									"created_at": "2015-09-14T23:06:52.000Z",
									"updated_at": "2015-09-14T23:06:52.000Z"
								},
								"begin_at": "2025-02-23T15:45:00.000Z",
								"correcteds": [
									{
										"id": 189251,
										"login": "achaisne",
										"url": "https://api.intra.42.fr/v2/users/achaisne"
									},
									{
										"id": 202885,
										"login": "mcogne--",
										"url": "https://api.intra.42.fr/v2/users/mcogne--"
									}
								],
								"corrector": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"truant": {
									"id": 177543,
									"login": "abergman",
									"url": "https://api.intra.42.fr/v2/users/abergman"
								},
								"filled_at": null,
								"questions_with_answers": []
							},
							"user": {
								"id": 177543,
								"email": "abergman@student.42.fr",
								"login": "abergman",
								"first_name": "Aron",
								"last_name": "Bergman",
								"usual_full_name": "Aron Bergman",
								"usual_first_name": null,
								"url": "https://api.intra.42.fr/v2/users/abergman",
								"phone": "hidden",
								"displayname": "Aron Bergman",
								"kind": "student",
								"image": {
									"link": "https://cdn.intra.42.fr/users/932073df2570926fdc1f927cb45f0dd5/abergman.jpg",
									"versions": {
										"large": "https://cdn.intra.42.fr/users/607ec2f60fdbda424b64808d611cf17d/large_abergman.jpg",
										"medium": "https://cdn.intra.42.fr/users/b451991403a62211e5d780221daaabc7/medium_abergman.jpg",
										"small": "https://cdn.intra.42.fr/users/ffd6439cd9fc47271fed6267900344e4/small_abergman.jpg",
										"micro": "https://cdn.intra.42.fr/users/612a1d0886c143ee8c656e269cb86b83/micro_abergman.jpg"
									}
								},
								"staff?": false,
								"correction_point": 7,
								"pool_month": "february",
								"pool_year": "2024",
								"location": "paul-f4Ar6s1",
								"wallet": 140,
								"anonymize_date": "2028-03-22T00:00:00.000+01:00",
								"data_erasure_date": "2028-03-22T00:00:00.000+01:00",
								"created_at": "2024-02-01T11:31:50.891Z",
								"updated_at": "2025-03-22T14:19:20.420Z",
								"alumnized_at": null,
								"alumni?": false,
								"active?": true
							}
						}
					]
				}
			]
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
