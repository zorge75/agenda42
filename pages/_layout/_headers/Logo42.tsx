import React from 'react';
import useDarkMode from "../../../hooks/useDarkMode";

const Logo42 = () => {
    const { darkModeStatus } = useDarkMode();

    return (
        <div className='col'
            style={{
                flexDirection: 'row',
                display: 'flex',
                alignItems: 'center'
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
        </div>
    );
}

export default Logo42;