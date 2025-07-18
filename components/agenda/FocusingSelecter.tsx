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

const FocusingSelector = ({ token }: any) => {
    // const dispatch = useDispatch();
    const [selected, setSelected] = useState(0);
    const [loadGeneral, setLoad] = useState(true);
    const refreshAgenda = useRefreshFriends(selected, token, setLoad);

    useEffect(() => {
        refreshAgenda();
    }, [refreshAgenda, selected]);

    console.log("selected", selected);

    return (
        <>
            <Select
                ariaLabel={""}
                id="focusing_selector"
                list={[
                    {
                        text: 'Me',
                        value: 0
                    },
                    {
                        text: 'Friend',
                        value: 129057
                    }
                ]}
                onChange={(item: any) => setSelected(item.target.value)}
            />
        </>
    );
};

export default FocusingSelector;
