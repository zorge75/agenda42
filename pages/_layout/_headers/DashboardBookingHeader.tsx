import {useState, useEffect } from 'react';
import classNames from 'classnames';
import Header, { HeaderLeft, HeaderRight } from '../../../layout/Header/Header';
import CommonHeaderChat from './CommonHeaderChat';
import useDarkMode from '../../../hooks/useDarkMode';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store'; // Import RootState type
import { useDispatch } from 'react-redux';
import { setUser } from '../../../store/slices/userSlice';

const DashboardBookingHeader = () => {
	const { darkModeStatus } = useDarkMode();

	const name = useSelector((state: RootState) => state.user.me);

	return (
		<Header>
			<HeaderLeft>
				<div className='d-flex align-items-center'>
					<div className='row g-4'>
						<div className='col-md-auto'>
							<div
								className={classNames('fs-3', 'fw-bold', {
									'text-dark': !darkModeStatus,
								})}>
								Hi, {name?.first_name} !
							</div>
						</div>
					</div>
				</div>
			</HeaderLeft>
			<HeaderRight>
				<CommonHeaderChat />
			</HeaderRight>
		</Header>
	);
};

export default DashboardBookingHeader;
