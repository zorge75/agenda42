import dayjs from "dayjs";
import Button from "../bootstrap/Button";
import { useDispatch, useSelector } from "react-redux";
import { setOriginalSlots, setSlots } from "../../store/slices/slotsSlice";
import { preparationSlots } from "../../common/function/preparationSlots";
import showNotification from "../extras/showNotification";
import Icon from "../icon/Icon";
import { RootState } from "../../store";
import Select from "../bootstrap/forms/Select";
import { useEffect, useState } from "react";
import { useRefreshFriends } from "../../hooks/useRefreshFriends";
import { CalendarFriendsButtons } from "../extras/friendsHalper";
import { CardActions } from "../bootstrap/Card";
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from "../bootstrap/Dropdown";
import Avatar from "../Avatar";
import { getName } from "../../helpers/helpers";

const FocusingSelector = ({ token, setLoad, friends }: any) => {
    const me = useSelector((state: RootState) => state.user.me);
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
            friend_image:  '',
         },
        ...friends.map(i => ({
            ...i,
            friend_id: i.friend_id | 0
        }))
      ];

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
                    {list.map(item => <DropdownItem>
                        <Button
                            color="link"
                            onClick={() => setSelected(item.friend_id)}
                        >
                            <Avatar src={item.friend_image} size={32} />
                            <span style={{ marginLeft: 15 }}>{item.friend_name} ({item.friend_login})</span>
                        </Button>
                    </DropdownItem>)}
                </DropdownMenu>
            </Dropdown>
        </CardActions>
      );
};

export default FocusingSelector;
