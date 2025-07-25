import React from 'react';
import dynamic from 'next/dynamic';
import { demoPagesMenu, pageLayoutTypesPagesMenu } from '../menu';

const asides = [
	{ path: demoPagesMenu.login.path, element: null, exact: true },
	{ path: demoPagesMenu.signUp.path, element: null, exact: true },
	{ path: pageLayoutTypesPagesMenu.blank.path, element: null, exact: true },
];

export default asides;
