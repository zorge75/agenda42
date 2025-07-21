import React from 'react';
import Header, { HeaderLeft } from '../../../layout/Header/Header';
import CommonHeaderChat from './CommonHeaderChat';
import CommonHeaderRight from './CommonHeaderRight';
import Logo42 from './Logo42';

const DashboardHeader = () => {
    return (
        <Header>
            <HeaderLeft>
                {process.env.NODE_ENV !== 'production' ? <Logo42 /> : <h3>a g e n d a 4 2 . f r</h3>}
            </HeaderLeft>
            <CommonHeaderRight afterChildren={<CommonHeaderChat />} />
        </Header>
    );
};

export default DashboardHeader;