import { TColor } from '../../type/color-type';

export interface IServiceProps {
	name: string;
	icon: string;
	color: TColor;
}

const surfing: IServiceProps = {
	name: 'BDE - SOIRÉE DE FIN DE MANDAT',
	icon: 'Surfing',
	color: 'info',
};
const kiteSurfing: IServiceProps = {
	name: 'BDE - SOIRÉE DE FIN DE MANDAT',
	icon: 'Kitesurfing',
	color: 'danger',
};
const tennis: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'SportsTennis',
	color: 'success',
};
const kayaking: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'Kayaking',
	color: 'info',
};
const handball: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'SportsHandball',
	color: 'warning',
};
const iceSkating: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'IceSkating',
	color: 'info',
};
const snowboarding: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'Snowboarding',
	color: 'warning',
};
const volleyball: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'SportsVolleyball',
	color: 'warning',
};
const cricket: IServiceProps = {
	name: '42 FITNESS - MALLOC TES MUSCLES',
	icon: 'SportsCricket',
	color: 'success',
};
const yoga: IServiceProps = {
	name: 'Yoga',
	icon: 'SelfImprovement',
	color: 'success',
};
const hiking: IServiceProps = {
	name: 'BDE - SOIRÉE DE FIN DE MANDAT',
	icon: 'Hiking',
	color: 'danger',
};
const football: IServiceProps = {
	name: 'BDE - SOIRÉE DE FIN DE MANDAT',
	icon: 'SportsFootball',
	color: 'success',
};

const SERVICES: { [key: string]: IServiceProps } = {
	SURFING: surfing,
	KITE_SURFING: kiteSurfing,
	TENNIS: tennis,
	KAYAKING: kayaking,
	HANDBALL: handball,
	ICE_SKATING: iceSkating,
	SNOWBOARDING: snowboarding,
	VOLLEYBALL: volleyball,
	CRICKET: cricket,
	YOGA: yoga,
	HIKING: hiking,
	FOOTBALL: football,
};

export function getServiceDataWithServiceName(serviceName: string) {
	return SERVICES[
		// @ts-ignore
		Object.keys(SERVICES).filter((f) => SERVICES[f].name.toString() === serviceName)
	];
}

export default SERVICES;
