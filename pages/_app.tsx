import React from 'react';
import '../styles/styles.scss';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'react-jss';
import { ToastContainer } from 'react-toastify';
import { TourProvider } from '@reactour/tour';
import { ReactNotifications } from 'react-notifications-component';
import { AuthContextProvider } from '../context/authContext';
import { ThemeContextProvider } from '../context/themeContext';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import Portal from '../layout/Portal/Portal';
import Wrapper from '../layout/Wrapper/Wrapper';
import App from '../layout/App/App';
import AsideRoutes from '../layout/Aside/AsideRoutes';
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

AppWithRedux.getInitialProps = async (props: any) => {
	const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

	const cookies = props.ctx.req?.headers.cookie
		? Object.fromEntries(
			props.ctx.req.headers.cookie.split('; ').map((cookie: any) => {
				const [key, value] = cookie.split('=');
				return [key, value];
			})
		)
		: {};

	const me = await fetch('https://api.intra.42.fr/v2/me', {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		},
	});

	if (!me.ok) {
		console.error(`Evaluations fetch failed with status: ${me.status}`);
		const text = await me.text();
		console.error('Response body:', text);
		return { cookies };
	}

	const meJson = await me.json();

	await delay(1000);

	const evaluations = await fetch('https://api.intra.42.fr/v2/me/scale_teams', {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		},
	});

	if (!evaluations.ok) {
		console.error(`Evaluations fetch failed with status: ${evaluations.status}`);
		const text = await evaluations.text();
		console.error('Response body:', text);
		return { cookies, me: meJson };
	}

	const evaluationsJson = await evaluations.json();

	await delay(1000);

	const params = new URLSearchParams({
		'page[size]': 100,
	});

	const slots = await fetch(`https://api.intra.42.fr/v2/me/slots?${params}`, {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		},
	});

	if (!slots.ok) {
		console.error(`Evaluations fetch failed with status: ${slots.status}`);
		const text = await slots.text();
		console.error('Response body:', text);
		return { cookies, me: meJson, evals: evaluationsJson };
	}

	const slotsJson = await slots?.json();

	await delay(1000);

	const events = await fetch('https://api.intra.42.fr/v2/users/' + meJson?.id + '/events?sort=-begin_at', {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		}
	});

	if (!events.ok) {
		console.error(`Evaluations fetch failed with status: ${events.status}`);
		const text = await events.text();
		console.error('Response body:', text);
		return { cookies, me: meJson, evals: evaluationsJson, slots: slotsJson };
	}

	const eventsJson = await events.json();

	await delay(1000);

	const defances = await fetch(`https://api.intra.42.fr/v2/me/scale_teams`, {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		}
	});

	if (!defances.ok) {
		console.error(`Evaluations fetch failed with status: ${defances.status}`);
		const text = await defances.text();
		console.error('Response body:', text);
		return { cookies };
	}

	const defancesJson = await defances.json();
	// const defancesJson = [
	// 	{
	// 		"id": 7920179,
	// 		"scale_id": 41098,
	// 		"comment": null,
	// 		"created_at": "2025-03-17T14:35:35.244Z",
	// 		"updated_at": "2025-03-17T14:35:35.244Z",
	// 		"feedback": null,
	// 		"final_mark": null,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-17T15:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": "invisible",
	// 		"truant": {},
	// 		"filled_at": null,
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 41098,
	// 			"evaluation_id": 3901,
	// 			"name": "scale 7.2",
	// 			"is_primary": true,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-03-12T13:59:10.442Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6422817,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6422817",
	// 			"final_mark": null,
	// 			"project_id": 1344,
	// 			"created_at": "2025-03-07T17:11:16.888Z",
	// 			"updated_at": "2025-03-17T14:35:35.398Z",
	// 			"status": "waiting_for_correction",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4191807
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": null,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"repo_uuid": "intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"locked_at": "2025-03-07T17:11:16.933Z",
	// 			"closed_at": "2025-03-17T13:36:49.855Z",
	// 			"project_session_id": 6167,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-06"
	// 		},
	// 		"feedbacks": []
	// 	},
	// 	{
	// 		"id": 7920176,
	// 		"scale_id": 41098,
	// 		"comment": null,
	// 		"created_at": "2025-03-17T14:34:38.100Z",
	// 		"updated_at": "2025-03-17T14:34:38.100Z",
	// 		"feedback": null,
	// 		"final_mark": null,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-17T15:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 144670,
	// 			"login": "kosipova",
	// 			"url": "https://api.intra.42.fr/v2/users/kosipova"
	// 		},
	// 		"truant": {},
	// 		"filled_at": null,
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 41098,
	// 			"evaluation_id": 3901,
	// 			"name": "scale 7.2",
	// 			"is_primary": true,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-03-12T13:59:10.442Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6422817,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6422817",
	// 			"final_mark": null,
	// 			"project_id": 1344,
	// 			"created_at": "2025-03-07T17:11:16.888Z",
	// 			"updated_at": "2025-03-17T14:35:35.398Z",
	// 			"status": "waiting_for_correction",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4191807
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": null,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"repo_uuid": "intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"locked_at": "2025-03-07T17:11:16.933Z",
	// 			"closed_at": "2025-03-17T13:36:49.855Z",
	// 			"project_session_id": 6167,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-06"
	// 		},
	// 		"feedbacks": []
	// 	}
	// ];

	await delay(1000);

	const defancesHistory = await fetch(`https://api.intra.42.fr/v2/users/${meJson.id}/scale_teams/as_corrected`, {
		headers: {
			Authorization: `Bearer ${cookies.token}`,
		}
	});

	if (!defancesHistory.ok) {
		console.error(`Evaluations fetch failed with status: ${defancesHistory.status}`);
		const text = await defancesHistory.text();
		console.error('Response body:', text);
		return { cookies };
	}

	const defancesHistoryJson = await defancesHistory.json();
	// const defancesHistoryJson = [
	// 	{
	// 		"id": 7920176,
	// 		"scale_id": 41098,
	// 		"comment": null,
	// 		"created_at": "2025-03-17T14:34:38.100Z",
	// 		"updated_at": "2025-03-17T14:34:38.100Z",
	// 		"feedback": null,
	// 		"final_mark": null,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-17T15:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 144670,
	// 			"login": "kosipova",
	// 			"url": "https://api.intra.42.fr/v2/users/kosipova"
	// 		},
	// 		"truant": {},
	// 		"filled_at": null,
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 41098,
	// 			"evaluation_id": 3901,
	// 			"name": "scale 7.2",
	// 			"is_primary": true,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-03-12T13:59:10.442Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6422817,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6422817",
	// 			"final_mark": null,
	// 			"project_id": 1344,
	// 			"created_at": "2025-03-07T17:11:16.888Z",
	// 			"updated_at": "2025-03-17T14:35:35.398Z",
	// 			"status": "waiting_for_correction",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4191807
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": null,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"repo_uuid": "intra-uuid-c09eb00f-5e68-4d7a-8f73-d10944656b0b-6422817-hsharame",
	// 			"locked_at": "2025-03-07T17:11:16.933Z",
	// 			"closed_at": "2025-03-17T13:36:49.855Z",
	// 			"project_session_id": 6167,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-06"
	// 		},
	// 		"feedbacks": []
	// 	},
	// 	{
	// 		"id": 7919577,
	// 		"scale_id": 41100,
	// 		"comment": "A l'exception de quelqueus erreurs, le code est propre et bien structure. Les explications sont claires aussi. Pense a mettre les idees de la class Brain en protected pour les raisons de securite, et WrongAnimal devrait posseder makeSound() qui n'est pas virtuelle afin de ne pas pemettre a WrongCat d'utiliser sa fonction a lui.",
	// 		"created_at": "2025-03-17T12:08:39.530Z",
	// 		"updated_at": "2025-03-17T13:25:23.938Z",
	// 		"feedback": "c'est une correctrice tres impliquee, merci pour le temps accorde, bon courage pour la suite",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-17T12:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 164758,
	// 				"login": "yantoine",
	// 				"url": "https://api.intra.42.fr/v2/users/yantoine"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-17T13:23:53.474Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 41100,
	// 			"evaluation_id": 3897,
	// 			"name": "scale 11.1",
	// 			"is_primary": true,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-03-12T13:59:35.767Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-14T09:39:35.772Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6448594,
	// 			"name": "yantoine's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6448594",
	// 			"final_mark": 0,
	// 			"project_id": 1342,
	// 			"created_at": "2025-03-16T14:33:24.277Z",
	// 			"updated_at": "2025-03-17T13:26:18.411Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 164758,
	// 					"login": "yantoine",
	// 					"url": "https://api.intra.42.fr/v2/users/yantoine",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4210281
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-38477491-74e5-40b1-91b8-83b0220f970c-6448594-yantoine",
	// 			"repo_uuid": "intra-uuid-38477491-74e5-40b1-91b8-83b0220f970c-6448594-yantoine",
	// 			"locked_at": "2025-03-16T14:33:24.325Z",
	// 			"closed_at": "2025-03-17T12:06:01.915Z",
	// 			"project_session_id": 6163,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-04"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7941107,
	// 				"user": {
	// 					"login": "yantoine",
	// 					"id": 164758,
	// 					"url": "https://profile.intra.42.fr/users/yantoine"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7919577,
	// 				"comment": "c'est une correctrice tres impliquee, merci pour le temps accorde, bon courage pour la suite",
	// 				"rating": 5,
	// 				"created_at": "2025-03-17T13:25:23.784Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7902901,
	// 		"scale_id": 41084,
	// 		"comment": "Bravo ! Tout fonctionne bien et les explications sont tres claires. Meci de m'avoir montre tout. Bon courage pour la derniere correction !",
	// 		"created_at": "2025-03-13T10:52:18.839Z",
	// 		"updated_at": "2025-03-13T12:20:37.902Z",
	// 		"feedback": "Super correctrice ! A bien pris le temps de verifier et comprendre les explications. Bon courage poour la suite des projets ;)",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 9,
	// 			"name": "Outstanding project",
	// 			"positive": true,
	// 			"icon": "star-1",
	// 			"created_at": "2017-05-18T14:07:37.380Z",
	// 			"updated_at": "2017-05-18T14:12:07.415Z"
	// 		},
	// 		"begin_at": "2025-03-13T11:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 159549,
	// 				"login": "apintus",
	// 				"url": "https://api.intra.42.fr/v2/users/apintus"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-13T12:13:08.768Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 41084,
	// 			"evaluation_id": 3696,
	// 			"name": "scale 3.1",
	// 			"is_primary": true,
	// 			"comment": "",
	// 			"introduction_md": "Please adhere to the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify the possible dysfunctions in the project of the student or\n  group whose work is being evaluated. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. Pedagogy is useful only if peer evaluation is done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work submitted in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student or students. Ensure that \n  the project is the expected one. Also, check that 'git clone' is used in an \n  empty directory.\n\n- Check carefully that no malicious aliases were used to deceive you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises, and if applicable, review together any scripts used \n  to facilitate grading (such as testing or automation scripts).\n\n- If you have not completed the assignment you are going to evaluate, you\n  must read the entire subject before starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, etc.\n  In these cases, the evaluation process ends, and the final grade is 0, \n  or -42 in the case of cheating. However, except in cases of cheating, students are \n  strongly encouraged to review the submitted work together \n  to identify any mistakes that should not be repeated in the future.\n",
	// 			"created_at": "2025-03-12T13:56:11.594Z",
	// 			"correction_number": 3,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-13T09:36:29.369Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6220367,
	// 			"name": "apintus's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6220367",
	// 			"final_mark": 100,
	// 			"project_id": 1983,
	// 			"created_at": "2024-11-29T17:36:56.372Z",
	// 			"updated_at": "2025-03-13T13:45:10.202Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 159549,
	// 					"login": "apintus",
	// 					"url": "https://api.intra.42.fr/v2/users/apintus",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4046067
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-780de75b-b44b-4194-9602-0b22aa9dcfa7-6220367-apintus",
	// 			"repo_uuid": "intra-uuid-780de75b-b44b-4194-9602-0b22aa9dcfa7-6220367-apintus",
	// 			"locked_at": "2024-11-29T17:36:56.430Z",
	// 			"closed_at": "2025-03-12T15:44:23.491Z",
	// 			"project_session_id": 5921,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/inception"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7923874,
	// 				"user": {
	// 					"login": "apintus",
	// 					"id": 159549,
	// 					"url": "https://profile.intra.42.fr/users/apintus"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7902901,
	// 				"comment": "Super correctrice ! A bien pris le temps de verifier et comprendre les explications. Bon courage poour la suite des projets ;)",
	// 				"rating": 5,
	// 				"created_at": "2025-03-13T12:20:37.688Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7873002,
	// 		"scale_id": 39753,
	// 		"comment": "Bravo, pour ce CPP05, bon courage pour le cercle du coup et bonne continuation.",
	// 		"created_at": "2025-03-07T15:33:40.793Z",
	// 		"updated_at": "2025-03-07T17:10:38.278Z",
	// 		"feedback": "Correcteur tres sympa, merci. Bon courage, le cpp va commencer bientot pour toi !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-07T16:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177885,
	// 			"login": "lscheupl",
	// 			"url": "https://api.intra.42.fr/v2/users/lscheupl"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-07T17:08:22.170Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39753,
	// 			"evaluation_id": 3900,
	// 			"name": "scale 10.2",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:27:58.924Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6412722,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6412722",
	// 			"final_mark": 100,
	// 			"project_id": 1343,
	// 			"created_at": "2025-03-04T11:32:49.963Z",
	// 			"updated_at": "2025-03-07T17:10:38.657Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4184496
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-04b73772-e0bc-40be-8565-4cd3400e1b78-6412722-hsharame",
	// 			"repo_uuid": "intra-uuid-04b73772-e0bc-40be-8565-4cd3400e1b78-6412722-hsharame",
	// 			"locked_at": "2025-03-04T11:32:49.995Z",
	// 			"closed_at": "2025-03-07T15:33:06.300Z",
	// 			"project_session_id": 6166,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-05"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7894985,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7873002,
	// 				"comment": "Correcteur tres sympa, merci. Bon courage, le cpp va commencer bientot pour toi !",
	// 				"rating": 5,
	// 				"created_at": "2025-03-07T17:10:38.101Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7873001,
	// 		"scale_id": 39753,
	// 		"comment": "SUPER PROJET, BRAVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO  !!!!",
	// 		"created_at": "2025-03-07T15:33:21.224Z",
	// 		"updated_at": "2025-03-07T17:08:55.038Z",
	// 		"feedback": "Super, merci pour la correction et de m'avoir montre la facon plus smart de realiser le job des interns de l'ex04",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 9,
	// 			"name": "Outstanding project",
	// 			"positive": true,
	// 			"icon": "star-1",
	// 			"created_at": "2017-05-18T14:07:37.380Z",
	// 			"updated_at": "2017-05-18T14:12:07.415Z"
	// 		},
	// 		"begin_at": "2025-03-07T16:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177526,
	// 			"login": "jcohen",
	// 			"url": "https://api.intra.42.fr/v2/users/jcohen"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-07T16:32:46.070Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39753,
	// 			"evaluation_id": 3900,
	// 			"name": "scale 10.2",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:27:58.924Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6412722,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6412722",
	// 			"final_mark": 100,
	// 			"project_id": 1343,
	// 			"created_at": "2025-03-04T11:32:49.963Z",
	// 			"updated_at": "2025-03-07T17:10:38.657Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4184496
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-04b73772-e0bc-40be-8565-4cd3400e1b78-6412722-hsharame",
	// 			"repo_uuid": "intra-uuid-04b73772-e0bc-40be-8565-4cd3400e1b78-6412722-hsharame",
	// 			"locked_at": "2025-03-04T11:32:49.995Z",
	// 			"closed_at": "2025-03-07T15:33:06.300Z",
	// 			"project_session_id": 6166,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-05"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7894978,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7873001,
	// 				"comment": "Super, merci pour la correction et de m'avoir montre la facon plus smart de realiser le job des interns de l'ex04",
	// 				"rating": 5,
	// 				"created_at": "2025-03-07T17:08:54.829Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7869582,
	// 		"scale_id": 35605,
	// 		"comment": "Trop dommage pour le petit deadlock. Finalement, on a pu trouver l'erreur, donc ca sera vite regle. Bon courage pour le retry !",
	// 		"created_at": "2025-03-06T15:43:01.124Z",
	// 		"updated_at": "2025-03-06T17:42:07.155Z",
	// 		"feedback": "Bonne correction rigoureuse, bon courage!",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 12,
	// 			"name": "Leaks",
	// 			"positive": false,
	// 			"icon": "blood",
	// 			"created_at": "2018-02-09T15:50:28.558Z",
	// 			"updated_at": "2018-02-09T15:50:28.558Z"
	// 		},
	// 		"begin_at": "2025-03-06T16:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 181647,
	// 				"login": "idjakovi",
	// 				"url": "https://api.intra.42.fr/v2/users/idjakovi"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-06T17:10:47.939Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 35605,
	// 			"evaluation_id": 2229,
	// 			"name": "scale 10",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- Remember that for the duration of the defense, no segfault, no other \n  unexpected, premature, uncontrolled or unexpected termination of the \n  program, else the final grade is 0. Use the appropriate flag. \n  You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must verify the absence of data races. \n  You are allowed to use any of the different tools available on the computer, \n  such as valgrind with \"--tool=helgrind\" and \"--tool=drd\". In case of any \n  data-race, the evaluation stops here.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. You are \n  allowed to use any of the different tools available on the computer, such \n  as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2024-07-22T13:26:56.493Z",
	// 			"correction_number": 3,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Spanish",
	// 					"identifier": "es",
	// 					"created_at": "2019-08-09T15:14:32.544Z",
	// 					"updated_at": "2025-03-17T13:13:46.514Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6420525,
	// 			"name": "idjakovi's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6420525",
	// 			"final_mark": 0,
	// 			"project_id": 1334,
	// 			"created_at": "2025-03-06T15:14:43.659Z",
	// 			"updated_at": "2025-03-06T17:42:22.938Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 181647,
	// 					"login": "idjakovi",
	// 					"url": "https://api.intra.42.fr/v2/users/idjakovi",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4190116
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-5f6cc2db-80e3-446c-b73e-4bb39c264d1e-6420525-idjakovi",
	// 			"repo_uuid": "intra-uuid-5f6cc2db-80e3-446c-b73e-4bb39c264d1e-6420525-idjakovi",
	// 			"locked_at": "2025-03-06T15:14:43.701Z",
	// 			"closed_at": "2025-03-06T15:39:45.028Z",
	// 			"project_session_id": 4505,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/philosophers"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7891378,
	// 				"user": {
	// 					"login": "idjakovi",
	// 					"id": 181647,
	// 					"url": "https://profile.intra.42.fr/users/idjakovi"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7869582,
	// 				"comment": "Bonne correction rigoureuse, bon courage!",
	// 				"rating": 5,
	// 				"created_at": "2025-03-06T17:42:07.124Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7863483,
	// 		"scale_id": 39742,
	// 		"comment": "Bravo pour ce module reussie. Premier module franchie (presque) avec succes. Pour moi tout est bon, les explications sont calires et le code est propre et fonctionnel. Bon courage pour la suite !",
	// 		"created_at": "2025-03-05T13:36:51.616Z",
	// 		"updated_at": "2025-03-05T16:05:06.259Z",
	// 		"feedback": "Super evaluation, merci pour l'ensemble des tests pousses et de toutes les categories possibles en particulier pour l'ex01. Bonne continuation !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-05T15:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 181430,
	// 				"login": "caubert",
	// 				"url": "https://api.intra.42.fr/v2/users/caubert"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-05T16:02:08.512Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39742,
	// 			"evaluation_id": 2230,
	// 			"name": "scale 7.2",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:25:19.592Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6346553,
	// 			"name": "caubert's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6346553",
	// 			"final_mark": 100,
	// 			"project_id": 1338,
	// 			"created_at": "2025-02-10T14:24:58.644Z",
	// 			"updated_at": "2025-03-05T17:00:19.484Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 181430,
	// 					"login": "caubert",
	// 					"url": "https://api.intra.42.fr/v2/users/caubert",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4138503
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-dcb7d278-e018-4dc4-aee2-cfa5876dc51e-6346553-caubert",
	// 			"repo_uuid": "intra-uuid-dcb7d278-e018-4dc4-aee2-cfa5876dc51e-6346553-caubert",
	// 			"locked_at": "2025-02-10T14:24:58.681Z",
	// 			"closed_at": "2025-03-05T13:36:20.160Z",
	// 			"project_session_id": 4506,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-00"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7885126,
	// 				"user": {
	// 					"login": "caubert",
	// 					"id": 181430,
	// 					"url": "https://profile.intra.42.fr/users/caubert"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7863483,
	// 				"comment": "Super evaluation, merci pour l'ensemble des tests pousses et de toutes les categories possibles en particulier pour l'ex01. Bonne continuation !",
	// 				"rating": 5,
	// 				"created_at": "2025-03-05T16:05:05.996Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7857102,
	// 		"scale_id": 39755,
	// 		"comment": "Super projet tres propre et bien explique. Bon courage pour le cercle suivant !",
	// 		"created_at": "2025-03-04T10:18:28.433Z",
	// 		"updated_at": "2025-03-04T11:27:23.435Z",
	// 		"feedback": "Correcteur curieux et applique, attentif aux explications du code. Meci pour la correction !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-04T11:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177660,
	// 			"login": "gchauvot",
	// 			"url": "https://api.intra.42.fr/v2/users/gchauvot"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-04T11:25:26.081Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39755,
	// 			"evaluation_id": 3897,
	// 			"name": "scale 7.2",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:17.797Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6409801,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6409801",
	// 			"final_mark": 100,
	// 			"project_id": 1342,
	// 			"created_at": "2025-03-03T10:10:19.490Z",
	// 			"updated_at": "2025-03-04T11:27:24.277Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4182701
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-bc48b444-52aa-4abe-a66a-726c2eac10d9-6409801-hsharame",
	// 			"repo_uuid": "intra-uuid-bc48b444-52aa-4abe-a66a-726c2eac10d9-6409801-hsharame",
	// 			"locked_at": "2025-03-03T10:10:19.538Z",
	// 			"closed_at": "2025-03-03T17:14:27.838Z",
	// 			"project_session_id": 6163,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-04"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7877694,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7857102,
	// 				"comment": "Correcteur curieux et applique, attentif aux explications du code. Meci pour la correction !",
	// 				"rating": 5,
	// 				"created_at": "2025-03-04T11:27:23.247Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7855994,
	// 		"scale_id": 39755,
	// 		"comment": "merci pour les explications, le code est bien maitrise, bravo ! Bon courage pour la suite :)",
	// 		"created_at": "2025-03-04T09:02:38.693Z",
	// 		"updated_at": "2025-03-04T10:19:40.917Z",
	// 		"feedback": "Merci pour la correction. J'espere que mes explications on ete claires. Bon courage pour so_long :)",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-04T09:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 203022,
	// 			"login": "jobourga",
	// 			"url": "https://api.intra.42.fr/v2/users/jobourga"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-04T10:17:28.448Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39755,
	// 			"evaluation_id": 3897,
	// 			"name": "scale 7.2",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:17.797Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6409801,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6409801",
	// 			"final_mark": 100,
	// 			"project_id": 1342,
	// 			"created_at": "2025-03-03T10:10:19.490Z",
	// 			"updated_at": "2025-03-04T11:27:24.277Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4182701
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-bc48b444-52aa-4abe-a66a-726c2eac10d9-6409801-hsharame",
	// 			"repo_uuid": "intra-uuid-bc48b444-52aa-4abe-a66a-726c2eac10d9-6409801-hsharame",
	// 			"locked_at": "2025-03-03T10:10:19.538Z",
	// 			"closed_at": "2025-03-03T17:14:27.838Z",
	// 			"project_session_id": 6163,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-04"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7877224,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7855994,
	// 				"comment": "Merci pour la correction. J'espere que mes explications on ete claires. Bon courage pour so_long :)",
	// 				"rating": 5,
	// 				"created_at": "2025-03-04T10:19:40.539Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7852981,
	// 		"scale_id": 39757,
	// 		"comment": "Bon projet, tout fonctionne bien. Juste attention aux message de la fonction attack() de ScavTrap qui doit etre different de ClapTrap. FragTrap, lui, ne doit pas forcement avoir sa fonction pour attaquer vu qu'il lq herite deja deouis ClapTrap. Dommage pour l'ex03 ou il y a l'implementation des fonctions membres dans .hpp, mais bravo pour la solution, t'as evite les pieges de heritage Diamond, Diamond herite bien toutes les valeurs. Bob courage pour la suite !",
	// 		"created_at": "2025-03-03T13:50:10.582Z",
	// 		"updated_at": "2025-03-03T15:11:45.200Z",
	// 		"feedback": "Merci pour ta correction et pour les tips du Makefile. Bon courage pour la suite ! ",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-03-03T14:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177667,
	// 				"login": "fzayani",
	// 				"url": "https://api.intra.42.fr/v2/users/fzayani"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-03-03T15:10:04.758Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39757,
	// 			"evaluation_id": 2233,
	// 			"name": "scale 7.1 1741787984 oiskmpcux",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:47.751Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6405690,
	// 			"name": "fzayani's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6405690",
	// 			"final_mark": 0,
	// 			"project_id": 1341,
	// 			"created_at": "2025-02-28T14:30:07.354Z",
	// 			"updated_at": "2025-03-03T15:11:48.954Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177667,
	// 					"login": "fzayani",
	// 					"url": "https://api.intra.42.fr/v2/users/fzayani",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4180248
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-076efda5-0148-4de1-a0ae-d5728031cda8-6405690-fzayani",
	// 			"repo_uuid": "intra-uuid-076efda5-0148-4de1-a0ae-d5728031cda8-6405690-fzayani",
	// 			"locked_at": "2025-02-28T14:30:07.392Z",
	// 			"closed_at": "2025-03-03T13:49:55.004Z",
	// 			"project_session_id": 4509,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-03"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7874178,
	// 				"user": {
	// 					"login": "fzayani",
	// 					"id": 177667,
	// 					"url": "https://profile.intra.42.fr/users/fzayani"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7852981,
	// 				"comment": "Merci pour ta correction et pour les tips du Makefile. Bon courage pour la suite ! ",
	// 				"rating": 5,
	// 				"created_at": "2025-03-03T15:11:45.000Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7843752,
	// 		"scale_id": 39758,
	// 		"comment": "Tous les exos sont realise parfaitement bien, les main sont complet. Bonne comprehension du code . Bon courage pour la suite !",
	// 		"created_at": "2025-02-28T16:41:35.614Z",
	// 		"updated_at": "2025-02-28T18:07:52.608Z",
	// 		"feedback": "Super correctrice, friendly et rigoureuse ! merci a toi pour cette correction et bonne continuation pour la suite !",
	// 		"final_mark": 80,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-28T17:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 159530,
	// 				"login": "opdi-bia",
	// 				"url": "https://api.intra.42.fr/v2/users/opdi-bia"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-28T17:53:48.776Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6402944,
	// 			"name": "opdi-bia's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6402944",
	// 			"final_mark": 80,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-27T13:34:34.604Z",
	// 			"updated_at": "2025-02-28T18:07:53.084Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 159530,
	// 					"login": "opdi-bia",
	// 					"url": "https://api.intra.42.fr/v2/users/opdi-bia",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4178024
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-4b891a70-d6b9-4788-bbf7-7a2f4ae13f4e-6402944-opdi-bia",
	// 			"repo_uuid": "intra-uuid-4b891a70-d6b9-4788-bbf7-7a2f4ae13f4e-6402944-opdi-bia",
	// 			"locked_at": "2025-02-27T13:34:34.642Z",
	// 			"closed_at": "2025-02-27T15:45:09.003Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7865305,
	// 				"user": {
	// 					"login": "opdi-bia",
	// 					"id": 159530,
	// 					"url": "https://profile.intra.42.fr/users/opdi-bia"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7843752,
	// 				"comment": "Super correctrice, friendly et rigoureuse ! merci a toi pour cette correction et bonne continuation pour la suite !",
	// 				"rating": 5,
	// 				"created_at": "2025-02-28T18:07:52.398Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7843554,
	// 		"scale_id": 39757,
	// 		"comment": "Great work, nice presentation- easy to see results. Good luck\t!",
	// 		"created_at": "2025-02-28T15:40:04.588Z",
	// 		"updated_at": "2025-02-28T18:04:26.705Z",
	// 		"feedback": "Parfait, merci pour la correction malgre mon anglais tres mediocre. bon courage pour Inception !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-28T17:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 129442,
	// 			"login": "solee2",
	// 			"url": "https://api.intra.42.fr/v2/users/solee2"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-28T17:32:42.907Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39757,
	// 			"evaluation_id": 2233,
	// 			"name": "scale 7.1 1741787984 oiskmpcux",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:47.751Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6405825,
	// 			"name": "hsharame's group-1",
	// 			"url": "https://api.intra.42.fr/v2/teams/6405825",
	// 			"final_mark": 100,
	// 			"project_id": 1341,
	// 			"created_at": "2025-02-28T15:16:33.467Z",
	// 			"updated_at": "2025-02-28T18:04:27.192Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4169019
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-58408e0d-d15b-4df3-9bae-eeb64a25e91c-6405825-hsharame",
	// 			"repo_uuid": "intra-uuid-58408e0d-d15b-4df3-9bae-eeb64a25e91c-6405825-hsharame",
	// 			"locked_at": "2025-02-28T15:16:33.508Z",
	// 			"closed_at": "2025-02-28T15:39:20.540Z",
	// 			"project_session_id": 4509,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-03"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7865287,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7843554,
	// 				"comment": "Parfait, merci pour la correction malgre mon anglais tres mediocre. bon courage pour Inception !",
	// 				"rating": 5,
	// 				"created_at": "2025-02-28T18:04:26.524Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7843552,
	// 		"scale_id": 39757,
	// 		"comment": "Tres bon travail, les codes sont bien ecrits, les notions sont bien expliques, les tests fonctionnent parfaitement, bonne continuation!",
	// 		"created_at": "2025-02-28T15:39:28.539Z",
	// 		"updated_at": "2025-02-28T16:37:21.064Z",
	// 		"feedback": "Correcteur tres sympathique et applique, super echange. Bonne continuation a toi aussi :)",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-28T16:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 181710,
	// 			"login": "shuwang",
	// 			"url": "https://api.intra.42.fr/v2/users/shuwang"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-28T16:34:59.967Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39757,
	// 			"evaluation_id": 2233,
	// 			"name": "scale 7.1 1741787984 oiskmpcux",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:47.751Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6405825,
	// 			"name": "hsharame's group-1",
	// 			"url": "https://api.intra.42.fr/v2/teams/6405825",
	// 			"final_mark": 100,
	// 			"project_id": 1341,
	// 			"created_at": "2025-02-28T15:16:33.467Z",
	// 			"updated_at": "2025-02-28T18:04:27.192Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4169019
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-58408e0d-d15b-4df3-9bae-eeb64a25e91c-6405825-hsharame",
	// 			"repo_uuid": "intra-uuid-58408e0d-d15b-4df3-9bae-eeb64a25e91c-6405825-hsharame",
	// 			"locked_at": "2025-02-28T15:16:33.508Z",
	// 			"closed_at": "2025-02-28T15:39:20.540Z",
	// 			"project_session_id": 4509,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-03"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7864949,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7843552,
	// 				"comment": "Correcteur tres sympathique et applique, super echange. Bonne continuation a toi aussi :)",
	// 				"rating": 5,
	// 				"created_at": "2025-02-28T16:37:20.810Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7837855,
	// 		"scale_id": 39758,
	// 		"comment": "Le code est propre et tous les tests fonctionnent comme il faut. Bon courage por la suite",
	// 		"created_at": "2025-02-27T12:02:09.464Z",
	// 		"updated_at": "2025-02-27T13:55:16.005Z",
	// 		"feedback": "evaluatrice consciencieuse sympatique et agreable :) merci et bon courage pour le ClapTrap",
	// 		"final_mark": 80,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-27T13:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 129196,
	// 				"login": "yuewang",
	// 				"url": "https://api.intra.42.fr/v2/users/yuewang"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-27T13:34:43.874Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6402484,
	// 			"name": "yuewang's group-1",
	// 			"url": "https://api.intra.42.fr/v2/teams/6402484",
	// 			"final_mark": 80,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-27T11:51:08.741Z",
	// 			"updated_at": "2025-02-27T13:55:16.556Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 129196,
	// 					"login": "yuewang",
	// 					"url": "https://api.intra.42.fr/v2/users/yuewang",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4166088
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-f15bee79-492e-45b3-93b3-b84f49702446-6402484-yuewang",
	// 			"repo_uuid": "intra-uuid-f15bee79-492e-45b3-93b3-b84f49702446-6402484-yuewang",
	// 			"locked_at": "2025-02-27T11:51:08.783Z",
	// 			"closed_at": "2025-02-27T12:01:23.391Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7858757,
	// 				"user": {
	// 					"login": "yuewang",
	// 					"id": 129196,
	// 					"url": "https://profile.intra.42.fr/users/yuewang"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7837855,
	// 				"comment": "evaluatrice consciencieuse sympatique et agreable :) merci et bon courage pour le ClapTrap",
	// 				"rating": 5,
	// 				"created_at": "2025-02-27T13:55:15.809Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7836733,
	// 		"scale_id": 35605,
	// 		"comment": "Bravo pour ce Philosophers reussi, tout marche comme demande dans le sujet, aucun leak ni data race. Le monitor surveuille le bon deroulement de simulation. Fais attentions aux message, nottamment quand un philo rend la deuxieme fourchette le message n'est pas complet, mais ceci n'est pas grave a mon avis. Felcitation pour ton code qui est tres clair. Bon courage ",
	// 		"created_at": "2025-02-27T09:34:28.012Z",
	// 		"updated_at": "2025-02-27T15:07:39.642Z",
	// 		"feedback": "Correctrice super sympa, discussion agreable et correction serieuse, tous les cas ont ete tester, merci et bon courage pour la suite !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-27T10:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 197877,
	// 				"login": "yfradj",
	// 				"url": "https://api.intra.42.fr/v2/users/yfradj"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-27T10:40:59.355Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 35605,
	// 			"evaluation_id": 2229,
	// 			"name": "scale 10",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- Remember that for the duration of the defense, no segfault, no other \n  unexpected, premature, uncontrolled or unexpected termination of the \n  program, else the final grade is 0. Use the appropriate flag. \n  You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must verify the absence of data races. \n  You are allowed to use any of the different tools available on the computer, \n  such as valgrind with \"--tool=helgrind\" and \"--tool=drd\". In case of any \n  data-race, the evaluation stops here.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. You are \n  allowed to use any of the different tools available on the computer, such \n  as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2024-07-22T13:26:56.493Z",
	// 			"correction_number": 3,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Spanish",
	// 					"identifier": "es",
	// 					"created_at": "2019-08-09T15:14:32.544Z",
	// 					"updated_at": "2025-03-17T13:13:46.514Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6388363,
	// 			"name": "yfradj's group-1",
	// 			"url": "https://api.intra.42.fr/v2/teams/6388363",
	// 			"final_mark": 100,
	// 			"project_id": 1334,
	// 			"created_at": "2025-02-24T07:54:47.987Z",
	// 			"updated_at": "2025-02-27T16:05:27.712Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 197877,
	// 					"login": "yfradj",
	// 					"url": "https://api.intra.42.fr/v2/users/yfradj",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4136674
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-69d4884e-8792-48a1-bf1e-6807c3038489-6388363-yfradj",
	// 			"repo_uuid": "intra-uuid-69d4884e-8792-48a1-bf1e-6807c3038489-6388363-yfradj",
	// 			"locked_at": "2025-02-24T07:54:48.024Z",
	// 			"closed_at": "2025-02-27T09:30:55.864Z",
	// 			"project_session_id": 4505,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/philosophers"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7859426,
	// 				"user": {
	// 					"login": "yfradj",
	// 					"id": 197877,
	// 					"url": "https://profile.intra.42.fr/users/yfradj"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7836733,
	// 				"comment": "Correctrice super sympa, discussion agreable et correction serieuse, tous les cas ont ete tester, merci et bon courage pour la suite !",
	// 				"rating": 5,
	// 				"created_at": "2025-02-27T15:07:39.474Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7830841,
	// 		"scale_id": 39757,
	// 		"comment": "Mis a part le fait qu'il faudrait bloquer les methodes quand hitPoints est a zero, et que si amount > hitPoints durant takeDamage(), hitPoints etant unsigned finira a une valeur innatendu; tout le reste est valide, il n'y pas de probleme de free.\r\nBonne continuation!",
	// 		"created_at": "2025-02-26T11:15:35.015Z",
	// 		"updated_at": "2025-02-27T10:54:00.783Z",
	// 		"feedback": "Merci pour la correction",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-26T12:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 181545,
	// 			"login": "cde-sous",
	// 			"url": "https://api.intra.42.fr/v2/users/cde-sous"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-26T12:51:29.710Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39757,
	// 			"evaluation_id": 2233,
	// 			"name": "scale 7.1 1741787984 oiskmpcux",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:28:47.751Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6390030,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6390030",
	// 			"final_mark": 0,
	// 			"project_id": 1341,
	// 			"created_at": "2025-02-24T13:37:08.058Z",
	// 			"updated_at": "2025-02-27T10:54:52.340Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4169019
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-1af6ab82-b197-4150-a774-b0a97e1388d5-6390030-hsharame",
	// 			"repo_uuid": "intra-uuid-1af6ab82-b197-4150-a774-b0a97e1388d5-6390030-hsharame",
	// 			"locked_at": "2025-02-24T13:37:08.106Z",
	// 			"closed_at": "2025-02-26T11:14:58.109Z",
	// 			"project_session_id": 4509,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-03"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7857299,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7830841,
	// 				"comment": "Merci pour la correction",
	// 				"rating": 5,
	// 				"created_at": "2025-02-27T10:54:00.543Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7818421,
	// 		"scale_id": 39758,
	// 		"comment": "Tres bon travail, code claire et tres bien explique ! Merci beaucoup et bon courage pour la suite !",
	// 		"created_at": "2025-02-24T12:23:34.066Z",
	// 		"updated_at": "2025-02-24T13:36:53.390Z",
	// 		"feedback": "Une correctrice gentille et attentive aux details. Merci Clara pour l'evaluation et de m'avoir aide avec cpp 03 ",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-24T13:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177790,
	// 			"login": "claprand",
	// 			"url": "https://api.intra.42.fr/v2/users/claprand"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-24T13:29:07.699Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6341155,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6341155",
	// 			"final_mark": 100,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-07T15:53:49.985Z",
	// 			"updated_at": "2025-02-24T13:36:53.914Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4135052
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-49dc59c0-3bc3-41c0-a859-2fdc6f4aa732-6341155-hsharame",
	// 			"repo_uuid": "intra-uuid-49dc59c0-3bc3-41c0-a859-2fdc6f4aa732-6341155-hsharame",
	// 			"locked_at": "2025-02-07T15:53:50.029Z",
	// 			"closed_at": "2025-02-24T09:46:59.412Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7838780,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7818421,
	// 				"comment": "Une correctrice gentille et attentive aux details. Merci Clara pour l'evaluation et de m'avoir aide avec cpp 03 ",
	// 				"rating": 5,
	// 				"created_at": "2025-02-24T13:36:53.166Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7817309,
	// 		"scale_id": 39758,
	// 		"comment": "Tres bonne comprehension de code et de module en general Les classes sont canon et le bsp prouve bien que les classes ont ete implemente comme il fallait. felicitations pour ce projet et bonne continuation !",
	// 		"created_at": "2025-02-24T10:15:17.820Z",
	// 		"updated_at": "2025-02-24T12:13:37.875Z",
	// 		"feedback": "excellent evaluation! Quel coincidemce que Hanna m'a corrige un projet quand elle a fini le meme projet de philo et de cpp02 dans le meme temps. Super echange de code et de la vie a 42. Pas de problem de ta correctiom de cpp02:D",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 9,
	// 			"name": "Outstanding project",
	// 			"positive": true,
	// 			"icon": "star-1",
	// 			"created_at": "2017-05-18T14:07:37.380Z",
	// 			"updated_at": "2017-05-18T14:12:07.415Z"
	// 		},
	// 		"begin_at": "2025-02-24T11:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 181591,
	// 				"login": "yfan",
	// 				"url": "https://api.intra.42.fr/v2/users/yfan"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-24T12:05:59.794Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6385359,
	// 			"name": "yfan's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6385359",
	// 			"final_mark": 100,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-22T12:49:47.224Z",
	// 			"updated_at": "2025-02-24T12:13:38.487Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 181591,
	// 					"login": "yfan",
	// 					"url": "https://api.intra.42.fr/v2/users/yfan",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4166206
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-eaa72345-c02c-4fe1-b3f0-7e20d834cef1-6385359-yfan",
	// 			"repo_uuid": "intra-uuid-eaa72345-c02c-4fe1-b3f0-7e20d834cef1-6385359-yfan",
	// 			"locked_at": "2025-02-22T12:49:47.257Z",
	// 			"closed_at": "2025-02-24T10:14:41.331Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7838127,
	// 				"user": {
	// 					"login": "yfan",
	// 					"id": 181591,
	// 					"url": "https://profile.intra.42.fr/users/yfan"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7817309,
	// 				"comment": "excellent evaluation! Quel coincidemce que Hanna m'a corrige un projet quand elle a fini le meme projet de philo et de cpp02 dans le meme temps. Super echange de code et de la vie a 42. Pas de problem de ta correctiom de cpp02:D",
	// 				"rating": 5,
	// 				"created_at": "2025-02-24T12:13:37.591Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7817297,
	// 		"scale_id": 39758,
	// 		"comment": "Fixed marche comme prevu, les tests sont bien. Fais attention aux variables qui doivent etre const et au facon d'implemneer l'operateur de surcharge =. Sinon felicitation et bon courage pour la suite",
	// 		"created_at": "2025-02-24T10:14:30.926Z",
	// 		"updated_at": "2025-02-24T11:52:32.554Z",
	// 		"feedback": "Merci pour les conseils et l'explication sur la modification des variables membres constantes",
	// 		"final_mark": 80,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-24T11:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 197751,
	// 				"login": "utiberto",
	// 				"url": "https://api.intra.42.fr/v2/users/utiberto"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-24T11:41:58.137Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6361474,
	// 			"name": "utiberto's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6361474",
	// 			"final_mark": 82,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-16T12:44:51.997Z",
	// 			"updated_at": "2025-02-24T11:52:33.172Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 197751,
	// 					"login": "utiberto",
	// 					"url": "https://api.intra.42.fr/v2/users/utiberto",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4148812
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-e17b3005-10d5-4be2-9dab-295f88623105-6361474-utiberto",
	// 			"repo_uuid": "intra-uuid-e17b3005-10d5-4be2-9dab-295f88623105-6361474-utiberto",
	// 			"locked_at": "2025-02-16T12:44:52.032Z",
	// 			"closed_at": "2025-02-24T10:14:04.097Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7837984,
	// 				"user": {
	// 					"login": "utiberto",
	// 					"id": 197751,
	// 					"url": "https://profile.intra.42.fr/users/utiberto"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7817297,
	// 				"comment": "Merci pour les conseils et l'explication sur la modification des variables membres constantes",
	// 				"rating": 5,
	// 				"created_at": "2025-02-24T11:52:32.277Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7817081,
	// 		"scale_id": 39758,
	// 		"comment": "NIce job ! Pour ma pars tu as bien compris les points fixe et tu m 'as tres bien expliquer ton approche sur BSP ! Pour moi je te valide le projet avec un outstanding car ton code etais tres claire et tres bien expliquer et tu as valider le bonus avec ! Felicitation a toi et bon courage pour le CPP3 ! =)",
	// 		"created_at": "2025-02-24T09:47:16.890Z",
	// 		"updated_at": "2025-02-24T13:34:53.266Z",
	// 		"feedback": "Merci beaucoup pour la correction, c'etait un plaisir d'echanger avec toi ",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 9,
	// 			"name": "Outstanding project",
	// 			"positive": true,
	// 			"icon": "star-1",
	// 			"created_at": "2017-05-18T14:07:37.380Z",
	// 			"updated_at": "2017-05-18T14:12:07.415Z"
	// 		},
	// 		"begin_at": "2025-02-24T10:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 159721,
	// 			"login": "sben-tay",
	// 			"url": "https://api.intra.42.fr/v2/users/sben-tay"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-24T10:51:33.918Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39758,
	// 			"evaluation_id": 2232,
	// 			"name": "scale 8.2 1741787993 ylxaqitwm",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:29:54.616Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6341155,
	// 			"name": "hsharame's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6341155",
	// 			"final_mark": 100,
	// 			"project_id": 1340,
	// 			"created_at": "2025-02-07T15:53:49.985Z",
	// 			"updated_at": "2025-02-24T13:36:53.914Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4135052
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-49dc59c0-3bc3-41c0-a859-2fdc6f4aa732-6341155-hsharame",
	// 			"repo_uuid": "intra-uuid-49dc59c0-3bc3-41c0-a859-2fdc6f4aa732-6341155-hsharame",
	// 			"locked_at": "2025-02-07T15:53:50.029Z",
	// 			"closed_at": "2025-02-24T09:46:59.412Z",
	// 			"project_session_id": 4508,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-02"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7838766,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7817081,
	// 				"comment": "Merci beaucoup pour la correction, c'etait un plaisir d'echanger avec toi ",
	// 				"rating": 5,
	// 				"created_at": "2025-02-24T13:34:53.063Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7807737,
	// 		"scale_id": 34880,
	// 		"comment": "Tres bon boulot, pas de leaks, tous les cas d'erreurs sont geres, c'est top! J'ai beaucoup aime la minimap et la map qui s'affiche dans le terminal! :)\r\nRien a redire, je vous souhaite bon courage pour la suite, et une bonne continuation! :))",
	// 		"created_at": "2025-02-21T14:27:38.071Z",
	// 		"updated_at": "2025-02-21T16:09:45.216Z",
	// 		"feedback": "Julie est une correctrice tres gentille et pro. La correction s'est passe dans une ambiance agreable. Merci d'avoir teste beaucoup de cas dans notre parsing et de ton interet pour notre raycasting. Bonne continuation",
	// 		"final_mark": 120,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-21T15:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 181578,
	// 			"login": "jchen",
	// 			"url": "https://api.intra.42.fr/v2/users/jchen"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-21T16:05:07.622Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6381339,
	// 			"name": "Ad Astra",
	// 			"url": "https://api.intra.42.fr/v2/teams/6381339",
	// 			"final_mark": 120,
	// 			"project_id": 1326,
	// 			"created_at": "2025-02-20T16:20:10.219Z",
	// 			"updated_at": "2025-02-21T16:09:46.659Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"repo_uuid": "intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"locked_at": "2025-02-20T16:20:36.862Z",
	// 			"closed_at": "2025-02-21T09:08:59.654Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7828730,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7807737,
	// 				"comment": "Julie est une correctrice tres gentille et pro. La correction s'est passe dans une ambiance agreable. Merci d'avoir teste beaucoup de cas dans notre parsing et de ton interet pour notre raycasting. Bonne continuation",
	// 				"rating": 5,
	// 				"created_at": "2025-02-21T16:09:44.889Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7807691,
	// 		"scale_id": 34880,
	// 		"comment": "Bravo pour ce cub3D qui n'est pas moche et qui fonctionne parfaitement ben. Attention aux verifications des mots cles dasn le parsing. Pas de leaks, pas d'erreur, tout est nickel. Bonne continuation a vous deux !",
	// 		"created_at": "2025-02-21T14:12:43.802Z",
	// 		"updated_at": "2025-02-21T15:11:59.902Z",
	// 		"feedback": "Merci pour la correction, bon courage pour la suite !",
	// 		"final_mark": 110,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-21T14:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 164935,
	// 				"login": "paulmart",
	// 				"url": "https://api.intra.42.fr/v2/users/paulmart"
	// 			},
	// 			{
	// 				"id": 181496,
	// 				"login": "rbouquet",
	// 				"url": "https://api.intra.42.fr/v2/users/rbouquet"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-21T15:10:59.476Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6266358,
	// 			"name": "GOAT Wolfromain's team",
	// 			"url": "https://api.intra.42.fr/v2/teams/6266358",
	// 			"final_mark": 110,
	// 			"project_id": 1326,
	// 			"created_at": "2025-01-10T13:44:50.083Z",
	// 			"updated_at": "2025-02-21T15:12:01.438Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 164935,
	// 					"login": "paulmart",
	// 					"url": "https://api.intra.42.fr/v2/users/paulmart",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4080428
	// 				},
	// 				{
	// 					"id": 181496,
	// 					"login": "rbouquet",
	// 					"url": "https://api.intra.42.fr/v2/users/rbouquet",
	// 					"leader": false,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4080429
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-338866cb-8e66-48bb-8a86-662a060b86dc-6266358-paulmart",
	// 			"repo_uuid": "intra-uuid-338866cb-8e66-48bb-8a86-662a060b86dc-6266358-paulmart",
	// 			"locked_at": "2025-01-10T15:19:08.897Z",
	// 			"closed_at": "2025-02-21T12:05:33.669Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7828483,
	// 				"user": {
	// 					"login": "paulmart",
	// 					"id": 164935,
	// 					"url": "https://profile.intra.42.fr/users/paulmart"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7807691,
	// 				"comment": "Merci pour la correction, bon courage pour la suite !",
	// 				"rating": 5,
	// 				"created_at": "2025-02-21T15:11:59.638Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7807403,
	// 		"scale_id": 35416,
	// 		"comment": "Felicitations pour ce projet reussi. Tout marche comme prevu et les explications sont bien clars. Bonne continuation !",
	// 		"created_at": "2025-02-21T12:54:56.739Z",
	// 		"updated_at": "2025-02-21T14:17:54.626Z",
	// 		"feedback": "Merci pour la correction !",
	// 		"final_mark": 100,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-21T13:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 159626,
	// 				"login": "yrigny",
	// 				"url": "https://api.intra.42.fr/v2/users/yrigny"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-21T14:14:51.977Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 35416,
	// 			"evaluation_id": 3696,
	// 			"name": "scale 3",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n",
	// 			"created_at": "2024-07-10T14:51:56.516Z",
	// 			"correction_number": 3,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6238838,
	// 			"name": "yrigny's group",
	// 			"url": "https://api.intra.42.fr/v2/teams/6238838",
	// 			"final_mark": 100,
	// 			"project_id": 1983,
	// 			"created_at": "2024-12-12T16:04:40.158Z",
	// 			"updated_at": "2025-02-21T14:17:55.814Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 159626,
	// 					"login": "yrigny",
	// 					"url": "https://api.intra.42.fr/v2/users/yrigny",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4059729
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-94df90fe-d598-4d2a-8b0c-870320c09491-6238838-yrigny",
	// 			"repo_uuid": "intra-uuid-94df90fe-d598-4d2a-8b0c-870320c09491-6238838-yrigny",
	// 			"locked_at": "2024-12-12T16:04:40.240Z",
	// 			"closed_at": "2025-02-20T18:27:29.358Z",
	// 			"project_session_id": 5921,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/inception"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7828290,
	// 				"user": {
	// 					"login": "yrigny",
	// 					"id": 159626,
	// 					"url": "https://profile.intra.42.fr/users/yrigny"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7807403,
	// 				"comment": "Merci pour la correction !",
	// 				"rating": 5,
	// 				"created_at": "2025-02-21T14:17:54.343Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7806277,
	// 		"scale_id": 34880,
	// 		"comment": "Tres bon cub3D, aucun probleme de leaks ou parsing et une bonne gestion des bonus. Un peu dommage pour la resolution qui est petite (peut-etre des optimisations a faire dans le code ?) et attention aux \\n.",
	// 		"created_at": "2025-02-21T09:10:45.788Z",
	// 		"updated_at": "2025-02-21T14:21:16.203Z",
	// 		"feedback": "Parfait, merci pour le tips de verification de l'allocation reussie par malloc",
	// 		"final_mark": 120,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-21T10:45:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 153695,
	// 			"login": "jblaye",
	// 			"url": "https://api.intra.42.fr/v2/users/jblaye"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-21T11:15:50.558Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6381339,
	// 			"name": "Ad Astra",
	// 			"url": "https://api.intra.42.fr/v2/teams/6381339",
	// 			"final_mark": 120,
	// 			"project_id": 1326,
	// 			"created_at": "2025-02-20T16:20:10.219Z",
	// 			"updated_at": "2025-02-21T16:09:46.659Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"repo_uuid": "intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"locked_at": "2025-02-20T16:20:36.862Z",
	// 			"closed_at": "2025-02-21T09:08:59.654Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7828298,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7806277,
	// 				"comment": "Parfait, merci pour le tips de verification de l'allocation reussie par malloc",
	// 				"rating": 5,
	// 				"created_at": "2025-02-21T14:21:16.023Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7806263,
	// 		"scale_id": 34880,
	// 		"comment": "Tres bon travail, le groupe connait parfaitement leur code, pas de probleme pour faire des modifications pour tester le fonctionnement de certain cas particulier, felicitation, et bonne continuation ;-)",
	// 		"created_at": "2025-02-21T09:09:34.587Z",
	// 		"updated_at": "2025-02-21T14:20:00.748Z",
	// 		"feedback": "Correcteur tres sympa et rigoureux. Merci de l'interet que t'as porte a notre code ",
	// 		"final_mark": 120,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-21T10:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 100441,
	// 			"login": "plefevre",
	// 			"url": "https://api.intra.42.fr/v2/users/plefevre"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-21T10:30:50.846Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6381339,
	// 			"name": "Ad Astra",
	// 			"url": "https://api.intra.42.fr/v2/teams/6381339",
	// 			"final_mark": 120,
	// 			"project_id": 1326,
	// 			"created_at": "2025-02-20T16:20:10.219Z",
	// 			"updated_at": "2025-02-21T16:09:46.659Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"repo_uuid": "intra-uuid-b5ecd487-e45b-47d3-9328-e2fbb4885eae-6381339-hsharame",
	// 			"locked_at": "2025-02-20T16:20:36.862Z",
	// 			"closed_at": "2025-02-21T09:08:59.654Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7828292,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7806263,
	// 				"comment": "Correcteur tres sympa et rigoureux. Merci de l'interet que t'as porte a notre code ",
	// 				"rating": 5,
	// 				"created_at": "2025-02-21T14:20:00.534Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7802372,
	// 		"scale_id": 39762,
	// 		"comment": "Tres bonne realisation des exos, le sujet est bien maitrise. Bon courage pour le reste de CPP",
	// 		"created_at": "2025-02-20T13:16:44.998Z",
	// 		"updated_at": "2025-02-20T14:38:31.753Z",
	// 		"feedback": "super, rigoureuse et sympathique merci pour ton temps!!",
	// 		"final_mark": 90,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-20T14:00:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 164956,
	// 				"login": "idakhlao",
	// 				"url": "https://api.intra.42.fr/v2/users/idakhlao"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-20T14:26:17.608Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 39762,
	// 			"evaluation_id": 2231,
	// 			"name": "scale 8.1",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please comply with the following rules:\n\n- Remain polite, courteous, respectful and constructive throughout the \n  evaluation process. The well-being of the community depends on it.\n\n- Identify with the student or group whose work is evaluated the possible \n  dysfunctions in their project. Take the time to discuss and debate the \n  problems that may have been identified.\n\n- You must consider that there might be some differences in how your peers \n  might have understood the project's instructions and the scope of its \n  functionalities. Always keep an open mind and grade them as honestly as \n  possible. The pedagogy is useful only and only if the peer-evaluation is \n  done seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that was turned in the Git repository of the evaluated \n  student or group.\n\n- Double-check that the Git repository belongs to the student(s). Ensure that \n  the project is the one expected. Also, check that 'git clone' is used in an \n  empty folder.\n\n- Check carefully that no malicious aliases was used to fool you and make you \n  evaluate something that is not the content of the official repository.\n\n- To avoid any surprises and if applicable, review together any scripts used \n  to facilitate the grading (scripts for testing or automation).\n\n- If you have not completed the assignment you are going to evaluate, you have \n  to read the entire subject prior to starting the evaluation process.\n\n- Use the available flags to report an empty repository, a non-functioning \n  program, a Norm error, cheating, and so forth. \n  In these cases, the evaluation process ends and the final grade is 0, \n  or -42 in case of cheating. However, except for cheating, student are \n  strongly encouraged to review together the work that was turned in, in order \n  to identify any mistakes that shouldn't be repeated in the future.\n\n- You should never have to edit any file except the configuration file if it \n  exists. If you want to edit a file, take the time to explicit the reasons \n  with the evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on \n  the heap must be properly freed before the end of execution. \n  You are allowed to use any of the different tools available on the computer, \n  such as leaks, valgrind, or e_fence. In case of memory leaks, tick the \n  appropriate flag.\n",
	// 			"created_at": "2025-02-05T10:33:38.161Z",
	// 			"correction_number": 2,
	// 			"duration": 1800,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6377189,
	// 			"name": "idakhlao's group-1",
	// 			"url": "https://api.intra.42.fr/v2/teams/6377189",
	// 			"final_mark": 90,
	// 			"project_id": 1339,
	// 			"created_at": "2025-02-19T17:32:40.453Z",
	// 			"updated_at": "2025-02-20T16:28:30.841Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 164956,
	// 					"login": "idakhlao",
	// 					"url": "https://api.intra.42.fr/v2/users/idakhlao",
	// 					"leader": true,
	// 					"occurrence": 1,
	// 					"validated": true,
	// 					"projects_user_id": 4122237
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": true,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-cdb69e4c-f0d1-44f0-9159-7a56b5d8ddad-6377189-idakhlao",
	// 			"repo_uuid": "intra-uuid-cdb69e4c-f0d1-44f0-9159-7a56b5d8ddad-6377189-idakhlao",
	// 			"locked_at": "2025-02-19T17:32:40.502Z",
	// 			"closed_at": "2025-02-20T13:15:30.032Z",
	// 			"project_session_id": 4507,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cpp-01"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7822764,
	// 				"user": {
	// 					"login": "idakhlao",
	// 					"id": 164956,
	// 					"url": "https://profile.intra.42.fr/users/idakhlao"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7802372,
	// 				"comment": "super, rigoureuse et sympathique merci pour ton temps!!",
	// 				"rating": 5,
	// 				"created_at": "2025-02-20T14:38:31.510Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7796067,
	// 		"scale_id": 34880,
	// 		"comment": "Bonne realisation de cub3d, trop dommage pour le segfault sur l'erreur de parsing (texture inexostantes apres le mot cle). A corriger egalement les murs avec un espace dans le coin. Sinon le projet a l'air bien matrise et elabre. Bon courage pour le retry, al prochaine sera bonne !",
	// 		"created_at": "2025-02-19T14:13:34.105Z",
	// 		"updated_at": "2025-02-19T16:06:42.795Z",
	// 		"feedback": "Thanks for finding our mistakes!",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 8,
	// 			"name": "Crash",
	// 			"positive": false,
	// 			"icon": "bomb",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-19T15:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 181534,
	// 				"login": "azakharo",
	// 				"url": "https://api.intra.42.fr/v2/users/azakharo"
	// 			},
	// 			{
	// 				"id": 181612,
	// 				"login": "mmychaly",
	// 				"url": "https://api.intra.42.fr/v2/users/mmychaly"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 177632,
	// 			"login": "hsharame",
	// 			"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-19T15:45:28.625Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6372199,
	// 			"name": "Karandashi team",
	// 			"url": "https://api.intra.42.fr/v2/teams/6372199",
	// 			"final_mark": 0,
	// 			"project_id": 1326,
	// 			"created_at": "2025-02-18T20:43:49.149Z",
	// 			"updated_at": "2025-02-19T16:06:47.251Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 181534,
	// 					"login": "azakharo",
	// 					"url": "https://api.intra.42.fr/v2/users/azakharo",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4111310
	// 				},
	// 				{
	// 					"id": 181612,
	// 					"login": "mmychaly",
	// 					"url": "https://api.intra.42.fr/v2/users/mmychaly",
	// 					"leader": false,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4073783
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-726dc417-9001-4fb8-8202-75593d240b8d-6372199-azakharo",
	// 			"repo_uuid": "intra-uuid-726dc417-9001-4fb8-8202-75593d240b8d-6372199-azakharo",
	// 			"locked_at": "2025-02-18T20:51:10.688Z",
	// 			"closed_at": "2025-02-19T14:12:35.589Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7816333,
	// 				"user": {
	// 					"login": "azakharo",
	// 					"id": 181534,
	// 					"url": "https://profile.intra.42.fr/users/azakharo"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7796067,
	// 				"comment": "Thanks for finding our mistakes!",
	// 				"rating": 5,
	// 				"created_at": "2025-02-19T16:06:42.768Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7782321,
	// 		"scale_id": 34880,
	// 		"comment": "Super projet, il a l'air bien compris malheuresement des leaks (de mlx_init()) qui pouvait etre corriger par le free de ce dernier.\r\nPetit tips pour le prochains push:\r\n    - n'heistait pas a faire des bools pour votre mouvement !\r\n    - Faire un executable a part pour les bonus (leaks de souris)\r\n     - Amusez vous!\r\nBon courage pour le repush\r\nRaphael",
	// 		"created_at": "2025-02-17T12:58:05.170Z",
	// 		"updated_at": "2025-02-17T16:19:12.522Z",
	// 		"feedback": "Merci pour la correction attentive, on fera attention la prochaine fois aux leaks de notre cher mlx. Bonne chance pour tes cpp !⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\r\n⠟⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\r\n⢷⡄⠈⡓⠢⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⠂⢹\r\n⠈⡷⡄⠈⠲⢤⣈⠻⠉⠛⠉⠉⠁⠒⠖⠉⠉⠉⠒⠶⢦⣤⠴⠒⢉⣡⢴⠀⠀⠀\r\n⠀⢸⡿⡂⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣴⡞⠉⠀⢀⣠⡞⠀\r\n⠀⠀⢙⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⢠⡼⡟⠀⠀\r\n⠀⠀⡼⠋⠀⣤⣀⠀⠀⠀⠀⠀⠈⠐⣂⣄⠀⠀⠀⠀⠀⠀⠀⢀⠀⣰⡟⠁⠀⠀\r\n⠀⢠⡇⠀⠀⠘⠛⠃⠀⠀⠀⠀⠾⣿⠿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀⠀⠀⠀\r\n⠀⢸⡇⢺⡀⠀⢠⡒⠠⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡀⠀⠀⠸⡇⠀⠀⠀\r\n⠀⢸⡇⣘⠑⡀⠀⠙⢏⣁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠂⠀⣔⣇⠀⠀⠀\r\n⠀⢸⡇⡁⠀⢳⣶⣾⣷⣦⣄⣀⡀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀\r\n⠀⠸⡇⠁⠀⠀⢏⠉⠀⠀⠙⠛⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡏⠀⠀⠀\r\n⠀⠀⠯⣀⣈⣀⣈⣐⣲⣄⣄⣤⣴⣆⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣈⣛⡧⠀⠀⠀",
	// 		"final_mark": 0,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-17T15:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 159453,
	// 			"login": "rparodi",
	// 			"url": "https://api.intra.42.fr/v2/users/rparodi"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-17T16:01:03.229Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6237345,
	// 			"name": "Per Aspera",
	// 			"url": "https://api.intra.42.fr/v2/teams/6237345",
	// 			"final_mark": 74,
	// 			"project_id": 1326,
	// 			"created_at": "2024-12-11T16:21:31.661Z",
	// 			"updated_at": "2025-02-17T16:19:13.259Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"repo_uuid": "intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"locked_at": "2024-12-11T22:32:17.398Z",
	// 			"closed_at": "2025-02-17T11:41:49.756Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7803244,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7782321,
	// 				"comment": "Merci pour la correction attentive, on fera attention la prochaine fois aux leaks de notre cher mlx. Bonne chance pour tes cpp !⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\r\n⠟⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\r\n⢷⡄⠈⡓⠢⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⠂⢹\r\n⠈⡷⡄⠈⠲⢤⣈⠻⠉⠛⠉⠉⠁⠒⠖⠉⠉⠉⠒⠶⢦⣤⠴⠒⢉⣡⢴⠀⠀⠀\r\n⠀⢸⡿⡂⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣴⡞⠉⠀⢀⣠⡞⠀\r\n⠀⠀⢙⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⢠⡼⡟⠀⠀\r\n⠀⠀⡼⠋⠀⣤⣀⠀⠀⠀⠀⠀⠈⠐⣂⣄⠀⠀⠀⠀⠀⠀⠀⢀⠀⣰⡟⠁⠀⠀\r\n⠀⢠⡇⠀⠀⠘⠛⠃⠀⠀⠀⠀⠾⣿⠿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀⠀⠀⠀\r\n⠀⢸⡇⢺⡀⠀⢠⡒⠠⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡀⠀⠀⠸⡇⠀⠀⠀\r\n⠀⢸⡇⣘⠑⡀⠀⠙⢏⣁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠂⠀⣔⣇⠀⠀⠀\r\n⠀⢸⡇⡁⠀⢳⣶⣾⣷⣦⣄⣀⡀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀\r\n⠀⠸⡇⠁⠀⠀⢏⠉⠀⠀⠙⠛⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡏⠀⠀⠀\r\n⠀⠀⠯⣀⣈⣀⣈⣐⣲⣄⣄⣤⣴⣆⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣈⣛⡧⠀⠀⠀",
	// 				"rating": 5,
	// 				"created_at": "2025-02-17T16:19:12.400Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7782311,
	// 		"scale_id": 34880,
	// 		"comment": "bon travail, tout marche bien, bon courage pour la suite!",
	// 		"created_at": "2025-02-17T12:56:10.536Z",
	// 		"updated_at": "2025-02-17T16:15:48.894Z",
	// 		"feedback": "Correcteur tres synpa, a bien pris le temps de tester notre cub3D",
	// 		"final_mark": 115,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-17T14:15:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 159343,
	// 			"login": "lvicino",
	// 			"url": "https://api.intra.42.fr/v2/users/lvicino"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-17T14:51:28.342Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6237345,
	// 			"name": "Per Aspera",
	// 			"url": "https://api.intra.42.fr/v2/teams/6237345",
	// 			"final_mark": 74,
	// 			"project_id": 1326,
	// 			"created_at": "2024-12-11T16:21:31.661Z",
	// 			"updated_at": "2025-02-17T16:19:13.259Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"repo_uuid": "intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"locked_at": "2024-12-11T22:32:17.398Z",
	// 			"closed_at": "2025-02-17T11:41:49.756Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7803218,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7782311,
	// 				"comment": "Correcteur tres synpa, a bien pris le temps de tester notre cub3D",
	// 				"rating": 5,
	// 				"created_at": "2025-02-17T16:15:48.456Z"
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"id": 7781825,
	// 		"scale_id": 34880,
	// 		"comment": "le projet est nickel, dommage pour l'erreur de parsing, \"Mis à part la description de la map, chaque type d’élément peut être séparéepar une ou plusieurs lignes vides\" et \" \"La description de la carte sera toujours en dernier dans le fichier, le reste des éléments peut être dans n’importe quel ordre.\" a part ca tout fonctionne, le code est bien organiser et la memoire est bien gere,",
	// 		"created_at": "2025-02-17T11:42:08.284Z",
	// 		"updated_at": "2025-02-17T16:15:12.125Z",
	// 		"feedback": "Merci pour la correction et d'avoir trouve une erreur dans le parsing. Bon courage ",
	// 		"final_mark": 108,
	// 		"flag": {
	// 			"id": 1,
	// 			"name": "Ok",
	// 			"positive": true,
	// 			"icon": "check-4",
	// 			"created_at": "2015-09-14T23:06:52.000Z",
	// 			"updated_at": "2015-09-14T23:06:52.000Z"
	// 		},
	// 		"begin_at": "2025-02-17T12:30:00.000Z",
	// 		"correcteds": [
	// 			{
	// 				"id": 177543,
	// 				"login": "abergman",
	// 				"url": "https://api.intra.42.fr/v2/users/abergman"
	// 			},
	// 			{
	// 				"id": 177632,
	// 				"login": "hsharame",
	// 				"url": "https://api.intra.42.fr/v2/users/hsharame"
	// 			}
	// 		],
	// 		"corrector": {
	// 			"id": 153663,
	// 			"login": "gbouguer",
	// 			"url": "https://api.intra.42.fr/v2/users/gbouguer"
	// 		},
	// 		"truant": {},
	// 		"filled_at": "2025-02-17T12:53:58.993Z",
	// 		"questions_with_answers": [],
	// 		"scale": {
	// 			"id": 34880,
	// 			"evaluation_id": 2187,
	// 			"name": "scale 6",
	// 			"is_primary": false,
	// 			"comment": "",
	// 			"introduction_md": "Please respect the following rules:\n\n- Remain polite, courteous, respectful and constructive\n  throughout the evaluation process. The well-being of the community\n  depends on it.\n\n- Identify with the person (or the group) evaluated the eventual\n  dysfunctions of the work. Take the time to discuss\n  and debate the problems you have identified.\n\n- You must consider that there might be some difference in how your\n  peers might have understood the project's instructions and the\n  scope of its functionalities. Always keep an open mind and grade\n  him/her as honestly as possible. The pedagogy is valid only and\n  only if peer evaluation is conducted seriously.\n",
	// 			"disclaimer_md": "",
	// 			"guidelines_md": "- Only grade the work that is in the student or group's\n  GiT repository.\n\n- Double-check that the GiT repository belongs to the student\n  or the group. Ensure that the work is for the relevant project\n  and also check that \"git clone\" is used in an empty folder.\n\n- Check carefully that no malicious aliases was used to fool you\n  and make you evaluate something other than the content of the\n  official repository.\n\n- To avoid any surprises, carefully check that both the evaluating\n  and the evaluated students have reviewed the possible scripts used\n  to facilitate the grading.\n\n- If the evaluating student has not completed that particular\n  project yet, it is mandatory for this student to read the\n  entire subject before starting the defense.\n\n- Use the flags available on this scale to signal an empty repository,\n  non-functioning program, norm error, cheating etc. In these cases,\n  the grading is over and the final grade is 0 (or -42 in case of\n  cheating). However, except for cheating, you are\n  encouraged to continue to discuss your work (even if you have not\n  finished it) to identify any issues that may have caused\n  this failure and avoid repeating the same mistake in the future.\n\n- Remember that for the duration of the defense, no segfault,\n  no other unexpected, premature, uncontrolled or unexpected\n  termination of the program, else the final grade is 0. Use the\n  appropriate flag.\n  You should never have to edit any file except the configuration file if it exists.\n  If you want to edit a file, take the time to explicit the reasons with the\n  evaluated student and make sure both of you are okay with this.\n\n- You must also verify the absence of memory leaks. Any memory allocated on the heap must\n  be properly freed before the end of execution.\n  You are allowed to use any of the different tools available on the computer, such as\n  leaks, valgrind, or e_fence. In case of memory leaks, tick the appropriate flag.\n",
	// 			"created_at": "2024-06-18T12:39:19.018Z",
	// 			"correction_number": 3,
	// 			"duration": 2700,
	// 			"manual_subscription": true,
	// 			"languages": [
	// 				{
	// 					"id": 2,
	// 					"name": "English",
	// 					"identifier": "en",
	// 					"created_at": "2015-04-14T16:07:38.122Z",
	// 					"updated_at": "2025-03-17T13:13:41.465Z"
	// 				},
	// 				{
	// 					"id": 1,
	// 					"name": "Français",
	// 					"identifier": "fr",
	// 					"created_at": "2014-11-02T16:43:38.466Z",
	// 					"updated_at": "2025-03-17T13:13:43.991Z"
	// 				}
	// 			],
	// 			"flags": [
	// 				{
	// 					"id": 1,
	// 					"name": "Ok",
	// 					"positive": true,
	// 					"icon": "check-4",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 2,
	// 					"name": "Empty work",
	// 					"positive": false,
	// 					"icon": "iconf-folder-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 3,
	// 					"name": "Incomplete work",
	// 					"positive": false,
	// 					"icon": "file-attention",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 5,
	// 					"name": "Invalid compilation",
	// 					"positive": false,
	// 					"icon": "skull-2",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 6,
	// 					"name": "Norme",
	// 					"positive": false,
	// 					"icon": "receipt-1",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 7,
	// 					"name": "Cheat",
	// 					"positive": false,
	// 					"icon": "layers",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 8,
	// 					"name": "Crash",
	// 					"positive": false,
	// 					"icon": "bomb",
	// 					"created_at": "2015-09-14T23:06:52.000Z",
	// 					"updated_at": "2015-09-14T23:06:52.000Z"
	// 				},
	// 				{
	// 					"id": 9,
	// 					"name": "Outstanding project",
	// 					"positive": true,
	// 					"icon": "star-1",
	// 					"created_at": "2017-05-18T14:07:37.380Z",
	// 					"updated_at": "2017-05-18T14:12:07.415Z"
	// 				},
	// 				{
	// 					"id": 10,
	// 					"name": "Incomplete group",
	// 					"positive": false,
	// 					"icon": "user-delete-2",
	// 					"created_at": "2017-05-18T14:11:51.883Z",
	// 					"updated_at": "2017-05-18T14:11:51.883Z"
	// 				},
	// 				{
	// 					"id": 11,
	// 					"name": "Concerning situation",
	// 					"positive": false,
	// 					"icon": "alert-2",
	// 					"created_at": "2017-11-03T12:27:44.876Z",
	// 					"updated_at": "2017-11-03T12:27:44.876Z"
	// 				},
	// 				{
	// 					"id": 12,
	// 					"name": "Leaks",
	// 					"positive": false,
	// 					"icon": "blood",
	// 					"created_at": "2018-02-09T15:50:28.558Z",
	// 					"updated_at": "2018-02-09T15:50:28.558Z"
	// 				},
	// 				{
	// 					"id": 13,
	// 					"name": "Forbidden Function",
	// 					"positive": false,
	// 					"icon": "delete-2",
	// 					"created_at": "2018-05-15T12:44:59.600Z",
	// 					"updated_at": "2018-05-15T12:44:59.600Z"
	// 				},
	// 				{
	// 					"id": 14,
	// 					"name": "Can’t support / explain code",
	// 					"positive": false,
	// 					"icon": "bubble-attention-4",
	// 					"created_at": "2023-06-15T13:50:25.655Z",
	// 					"updated_at": "2023-06-15T13:50:25.655Z"
	// 				}
	// 			],
	// 			"free": false
	// 		},
	// 		"team": {
	// 			"id": 6237345,
	// 			"name": "Per Aspera",
	// 			"url": "https://api.intra.42.fr/v2/teams/6237345",
	// 			"final_mark": 74,
	// 			"project_id": 1326,
	// 			"created_at": "2024-12-11T16:21:31.661Z",
	// 			"updated_at": "2025-02-17T16:19:13.259Z",
	// 			"status": "finished",
	// 			"terminating_at": null,
	// 			"users": [
	// 				{
	// 					"id": 177543,
	// 					"login": "abergman",
	// 					"url": "https://api.intra.42.fr/v2/users/abergman",
	// 					"leader": false,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4055127
	// 				},
	// 				{
	// 					"id": 177632,
	// 					"login": "hsharame",
	// 					"url": "https://api.intra.42.fr/v2/users/hsharame",
	// 					"leader": true,
	// 					"occurrence": 0,
	// 					"validated": true,
	// 					"projects_user_id": 4058670
	// 				}
	// 			],
	// 			"locked?": true,
	// 			"validated?": false,
	// 			"closed?": true,
	// 			"repo_url": "git@vogsphere.42paris.fr:vogsphere/intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"repo_uuid": "intra-uuid-e873d6ac-6e09-48bb-b4f9-e93d1abd691f-6237345-hsharame",
	// 			"locked_at": "2024-12-11T22:32:17.398Z",
	// 			"closed_at": "2025-02-17T11:41:49.756Z",
	// 			"project_session_id": 4476,
	// 			"project_gitlab_path": "pedago_world/42-cursus/inner-circle/cub3d"
	// 		},
	// 		"feedbacks": [
	// 			{
	// 				"id": 7803212,
	// 				"user": {
	// 					"login": "hsharame",
	// 					"id": 177632,
	// 					"url": "https://profile.intra.42.fr/users/hsharame"
	// 				},
	// 				"feedbackable_type": "ScaleTeam",
	// 				"feedbackable_id": 7781825,
	// 				"comment": "Merci pour la correction et d'avoir trouve une erreur dans le parsing. Bon courage ",
	// 				"rating": 5,
	// 				"created_at": "2025-02-17T16:15:11.892Z"
	// 			}
	// 		]
	// 	}
	// ];


	return {
		cookies,
		me: meJson,
		slots: slotsJson,
		events: eventsJson,
		evals: evaluationsJson,
		defances: defancesJson,
		defancesHistory: defancesHistoryJson,
		token: cookies.token,
	};
};

export default AppWithRedux;
