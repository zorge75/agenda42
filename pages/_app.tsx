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
import { setSlots, setOriginalSlots, setScaleTeams } from '../store/slices/slotsSlice';
import { setEvents } from '../store/slices/eventsSlice';
import { current } from '@reduxjs/toolkit';
import { preparationSlots } from '../common/function/preparationSlots';
import { getNextEvaluation } from '../common/function/getNextEvaluation';

interface AppPropsCustom extends AppProps {
	token: string,
	me: any,
	evals: any,
	events: any,
	slots: any,
}

const MyApp = ({ Component, pageProps, token, me, evals, slots, events }: AppPropsCustom) => {
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
			Authorization: `Bearer ${cookies.token}`, // From .env.local
		},
	});

	if (!me.ok) {
		console.error(`Evaluations fetch failed with status: ${me.status}`);
		const text = await me.text(); // Получаем текст ответа
		console.error('Response body:', text);
		return { cookies }; // Прерываем выполнение, если ошибка
	}

	const meJson = await me.json();

	await delay(1000);

	const evaluations = await fetch('https://api.intra.42.fr/v2/me/scale_teams', {
		headers: {
			Authorization: `Bearer ${cookies.token}`, // From .env.local
		},
	});

	if (!evaluations.ok) {
		console.error(`Evaluations fetch failed with status: ${evaluations.status}`);
		const text = await evaluations.text(); // Получаем текст ответа
		console.error('Response body:', text);
		return { cookies, me: meJson }; // Прерываем выполнение, если ошибка
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
		const text = await slots.text(); // Получаем текст ответа
		console.error('Response body:', text);
		return { cookies, me: meJson, evals: evaluationsJson }; // Прерываем выполнение, если ошибка
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
		const text = await events.text(); // Получаем текст ответа
		console.error('Response body:', text);
		return { cookies, me: meJson, evals: evaluationsJson, slots: slotsJson }; // Прерываем выполнение, если ошибка
	}

	const eventsJson = await events.json();
	// await delay(1000);

	// const exams = await fetch('https://api.intra.42.fr/', {
	// 	headers: {
	// 		Authorization: `Bearer ${cookies.token}`, // From .env.local
	// 	}
	// });

	// if (!exams.ok) {
	// 	console.error(`Evaluations fetch failed with status: ${exams.status}`);
	// 	const text = await exams.text(); // Получаем текст ответа
	// 	console.error('Response body:', text);
	// 	return { cookies }; // Прерываем выполнение, если ошибка
	// }

	// const examsJson = await exams.json();

	// console.log(examsJson);

	return {
		cookies,
		me: meJson,
		evals: evaluationsJson,
		slots: slotsJson,
		events: eventsJson,
		token: cookies.token,
	};
};

export default AppWithRedux;
