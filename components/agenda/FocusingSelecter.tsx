import Button from "../bootstrap/Button";

import { useEffect, useState } from "react";
import { useRefreshFriends } from "../../hooks/useRefreshFriends";
import { CardActions } from "../bootstrap/Card";
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from "../bootstrap/Dropdown";
import Avatar from "../Avatar";
import { alphabeticSort, getName } from "../../helpers/helpers";

const FocusingSelector = ({ token, setLoad, friends, me }: any) => {
    const [selected, setSelected] = useState(me.id);
    const refreshFriends = useRefreshFriends(selected, token, setLoad);

    useEffect(() => {
        if (selected && friends)
            refreshFriends();
    }, [refreshFriends, selected]);

    if (!friends)
        return;

    const list = [
        {
            friend_id: me.id,
            friend_name: getName(me),
            friend_login: me.login,
            friend_image: '',
        },
        ...alphabeticSort(friends, "friend_login").map(i => ({
            ...i,
            friend_id: i.friend_id | 0
        }))
    ].slice(0, 6);

    return (
        <CardActions>
            <Dropdown direction="down">
                <DropdownToggle>
                    <Button
                        color="primary"
                    >
                        {list?.find(i => (i.friend_id == selected)).friend_name}
                    </Button>
                </DropdownToggle>
                <DropdownMenu isAlignmentEnd >
                    <DropdownItem>
                        <Button
                            color="link"
                            icon="Info"
                            isDisable
                        >Maximum 5 first friends
                        </Button>
                    </DropdownItem>
                    {list.map(item => (
                        <DropdownItem>
                            <Button
                                color="link"
                                onClick={() => setSelected(item.friend_id)}
                            >
                                <Avatar src={item.friend_image} size={32} />
                                <span style={{ marginLeft: 15 }}>{item.friend_name} ({item.friend_login})</span>
                            </Button>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </CardActions>
    );
};

export default FocusingSelector;
