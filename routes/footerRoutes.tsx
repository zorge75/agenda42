import React from 'react';
import Changelog from '../pages/changelog';
import DefaultFooter from '../pages/_layout/_footers/DefaultFooter';

const footers = [
	{ path: '/changelog', element: <Changelog/>, exact: true },
	{ path: '/*', element: <DefaultFooter />, exact: true },
];

export default footers;
