import Button from "../bootstrap/Button";

import { useEffect, useState } from "react";
import { useRefreshFriends } from "../../hooks/useRefreshFriends";
import { CardActions } from "../bootstrap/Card";
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from "../bootstrap/Dropdown";
import Avatar from "../Avatar";
import { alphabeticSort, getName } from "../../helpers/helpers";
import dayjs from "dayjs";

function getPrevTenNumbers() {
    const currentYear = dayjs().year();
    const result = [];
    for (let i = 0; i <= 5; i++) {
        result.push(currentYear - i);
    }
    return result;
}

function getMonths() {
    return [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december'
    ];
}

const PiscineSelect = ({ monthSort, yearSort, setYear, setMonth, setUsers, setPage, setMaxPage }: any) => {
    return (
        <div style={{ marginLeft: 20, display: 'flex' }}>
            <Button
                style={{ borderRadius: '1rem 0 0 1rem' }}
                color="light"
            >
                Month and year :
            </Button>
            <Dropdown direction="down">
                <DropdownToggle>
                    <Button style={{ borderRadius: '0 1rem 1rem 0' }}
                        color="light"
                    >
                        {monthSort}
                    </Button>
                </DropdownToggle>
                <DropdownMenu >
                    {getMonths().map(item => (
                        <DropdownItem>
                            <Button
                                color="link"
                                onClick={() => {
                                    setUsers([]);
                                    setMonth(item);
                                    setPage(1);
                                    setMaxPage(1);
                                }
                                }
                            >
                                <span>{item}</span>
                            </Button>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
            <Dropdown direction="down">
                <DropdownToggle>
                    <Button style={{ borderRadius: '0 1rem 1rem 0' }}
                        color="light"
                    >
                        {yearSort}
                    </Button>
                </DropdownToggle>
                <DropdownMenu >
                    {getPrevTenNumbers().map(item => (
                        <DropdownItem>
                            <Button
                                color="link"
                                onClick={() => {
                                    setUsers([]);
                                    setYear(item);
                                    setPage(1);
                                    setMaxPage(1);
                                }
                                }
                            >
                                <span>{item}</span>
                            </Button>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};

export default PiscineSelect;
