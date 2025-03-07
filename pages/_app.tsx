import React from 'react';
import '../styles/styles.scss';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'react-jss';
import { ToastContainer } from 'react-toastify';
import { TourProvider } from '@reactour/tour';
import { ReactNotifications } from 'react-notifications-component';
import { appWithTranslation } from 'next-i18next';
import { AuthContextProvider } from '../context/authContext';
import { ThemeContextProvider } from '../context/themeContext';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import steps, { styles } from '../steps';
import Portal from '../layout/Portal/Portal';
import Wrapper from '../layout/Wrapper/Wrapper';
import App from '../layout/App/App';
import AsideRoutes from '../layout/Aside/AsideRoutes';
import { ToastCloseButton } from '../components/bootstrap/Toasts';
import { parseCookies } from 'nookies';

type Cookies = { token: string };

interface CustomAppProps extends AppProps {
  cookies?: Cookies;
  me?: any; // Rest from api 42
}

const MyApp = ({ Component, pageProps, cookies, me }: CustomAppProps) => {
	getOS();

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
		<AuthContextProvider initialToken={cookies.token} me={me}>
			<ThemeContextProvider>
				<ThemeProvider theme={theme}>
					<TourProvider
						steps={steps}
						styles={styles}
						showNavigation={false}
						showBadge={false}>
						<App>
							<AsideRoutes />
							<Wrapper>
								{/* eslint-disable-next-line react/jsx-props-no-spreading */}
								<Component {...pageProps} />
							</Wrapper>
						</App>
						<Portal id='portal-notification'>
							<ReactNotifications />
						</Portal>
						<ToastContainer
							closeButton={ToastCloseButton}
							toastClassName='toast show'
						/>
					</TourProvider>
				</ThemeProvider>
			</ThemeContextProvider>
		</AuthContextProvider>
	);
};

MyApp.getInitialProps = async ({ ctx }: { ctx: { req?: IncomingMessage } }) => {
	const cookies = ctx.req?.headers.cookie
		? Object.fromEntries(
			ctx.req.headers.cookie.split('; ').map((cookie) => {
				const [key, value] = cookie.split('=');
				return [key, value];
			})
		)
		: {};

	const response = await fetch('https://api.intra.42.fr/v2/me', {
		headers: {
			Authorization: `Bearer ${cookies.token}`, // From .env.local
		},
	});

	if (!response.ok) {
		return {cookies};
	}

	const me = await response.json();

	return { cookies, me };
};

export default appWithTranslation(MyApp /* , nextI18NextConfig */);
