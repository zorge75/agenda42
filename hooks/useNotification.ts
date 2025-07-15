import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setEventActive, setCanvasIsOpen } from "../store/slices/calendarSlice";

// For open modal of the event, use query "notify=EVENT_ID" (https://agenda42.fr/?notify=33210)
// TODO: add a function to delete this request after opening the Mode window
const useNotification = (events: any, notify: any, settings: any) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (events && notify) {
            const isEvent = events.filter((i: any) => (i.id == notify))[0];
            if (isEvent?.id) {
                dispatch(setEventActive(isEvent));
                dispatch(setCanvasIsOpen());
            }
        }
    }, [events, notify, settings]);
};

export default useNotification;
