import React from 'react';
import Header, { HeaderLeft } from '../../../layout/Header/Header';
import CommonHeaderChat from './CommonHeaderChat';
import CommonHeaderRight from './CommonHeaderRight';

const DashboardHeader = () => {
	return (
		<Header>
			<HeaderLeft>
				<h4 className='fw-bold' style={{ 'margin': 0 }}>Agenda 42 <sup>beta</sup></h4>
			</HeaderLeft>
			<CommonHeaderRight afterChildren={<CommonHeaderChat />} />
		</Header>
	);
};

export default DashboardHeader;
