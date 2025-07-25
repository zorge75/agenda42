
import { useRef, useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { setEvals } from "../store/slices/evalsSlice";
import { setGender, setSavedSettings } from "../store/slices/settingsReducer";
import { setSavedFriends, setSavedWavingHand } from "../store/slices/friendsReducer";
import { setOriginalSlots, setSlots, setDefances, setDefancesHistory } from "../store/slices/slotsSlice";
import { getNextEvaluation } from "../common/function/getNextEvaluation";
import { getGenderOfUser, getUserFriends, getUserSettings, getUserWavingHand } from "../common/function/getUserSettings";
import { preparationSlots } from "../common/function/preparationSlots";
import { setUser } from "../store/slices/userSlice";
import { setAllEvents, setEvents } from "../store/slices/eventsSlice";
import { setUnitType } from "../store/slices/calendarSlice";
import ThemeContext from "../context/themeContext";

export const useRefreshAgenda = ({ me, token, setLoad }: any) => {
    const { viewModeStatus } = useContext(ThemeContext);
    const dispatch = useDispatch();
    const isFetching = useRef(false); // Prevent concurrent fetches

    const refreshAgenda = useCallback(async () => {
        if (isFetching.current) {
            console.log('Refresh already in progress, skipping...');
            return; // Skip if already fetching
        }

        isFetching.current = true;
        try {
            setLoad(true);
            dispatch(setUser(me));
            const genderData = await getGenderOfUser(me.login);
            console.log("genderData", genderData)
            dispatch(setGender(genderData));
            if (genderData.status == "NOT_FOUND")
                return;

            const response = await fetch(`/api/refresh_agenda?id=${me.id}&campusId=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store', // Prevent stale data if needed
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to refresh agenda: ${res.message || response.status}`);
            }

            // Update Redux store in a single batch to minimize re-renders

            const settingsData = await getUserSettings(me.id);
            const friendsData = await getUserFriends(me.id);
            const wavingHandData = await getUserWavingHand(me.id);
            dispatch(setSavedSettings(settingsData));
            dispatch(setSavedFriends(friendsData));
            dispatch(setSavedWavingHand(wavingHandData));

            if (res.slots) {
                const preparedSlots = preparationSlots(res.slots);
                getNextEvaluation(preparedSlots, settingsData?.data?.chat_id, res.events);
                dispatch(setOriginalSlots(res.slots));
                dispatch(setSlots(preparedSlots));
            }
            if (res.evaluations) {
                dispatch(setEvals(res.evaluations)); // TODO : defancesHistory ?
                dispatch(setDefances(res.evaluations));
            }
            // Batch additional updates
            res.defancesHistory && dispatch(setDefancesHistory(res.defancesHistory));
            res.events && dispatch(setEvents(res.events));
            res.campusEvents && dispatch(setAllEvents(res.campusEvents));

            dispatch(setUnitType(viewModeStatus));
        } catch (error) {
            console.error('Refresh Agenda Error:', error);
            // Optionally rethrow or handle error for UI feedback
        } finally {
            setLoad(false);
            isFetching.current = false;
        }
    }, [dispatch, me?.id, token, setLoad]); // Stable dependencies

    return refreshAgenda;
};