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

const FocusingSelector = ({ token, setLoad, friends }: any) => {
    const [selected, setSelected] = useState(0);
    const refreshFriends = useRefreshFriends(selected, token, setLoad);
    const {id, login} = useSelector((state: RootState) => state.user.me);

    useEffect(() => {
        if (selected && friends)
            refreshFriends();
    }, [refreshFriends, selected]);

    if (!friends)
        return;

    const list = [
        { text: login, value: id },
        ...friends.map(i => ({
            text: i.friend_login,
            value: i.friend_id | 0
        }))
      ];

    return (
        <>
            <Select
                ariaLabel={""}
                color='primary'
                id="focusing_selector"
                list={list}
                onChange={(item: any) => setSelected(item.target.value)}
            />
        </>
    );
};

export default FocusingSelector;
