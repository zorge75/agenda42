import dayjs from "dayjs";
import Button from "../bootstrap/Button";
import { useDispatch, useSelector } from "react-redux";
import { setOriginalSlots, setSlots } from "../../store/slices/slotsSlice";
import { preparationSlots } from "../../common/function/preparationSlots";
import showNotification from "../extras/showNotification";
import Icon from "../icon/Icon";
import { RootState } from "../../store";

const MeetingRooms = ({ eventItem, token, originalSlotsIntra }: any) => {
    const dispatch = useDispatch();


    return (
        <>
            
        </>
    );
};

export default MeetingRooms;
