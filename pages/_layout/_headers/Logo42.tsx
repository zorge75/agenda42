import React from 'react';
import useDarkMode from "../../../hooks/useDarkMode";
import Link from 'next/link';

const Logo42 = () => {
    const { darkModeStatus } = useDarkMode();

    return (
        <Link href='/' className='col'
            style={{
                flexDirection: 'row',
                display: 'flex',
                alignItems: 'center',
                color: 'initial',
                width: 'maxContent',
                textDecoration: 'none',
            }}
        >
            <img
                style={{
                    marginRight: 10,
                    width: 42,
                    filter: !darkModeStatus ? "brightness(1) invert(1)" : "none"
                }}
                src="https://42.fr/wp-content/uploads/2021/05/42-Final-sigle-seul.svg"></img>
            <h4 className="fw-bold">Agenda</h4>
        </Link>
    );
}

export default Logo42;