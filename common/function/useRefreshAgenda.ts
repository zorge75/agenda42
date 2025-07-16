
import { useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setEvals } from "../../store/slices/evalsSlice";
import { setSavedSettings } from "../../store/slices/settingsReducer";
import { setOriginalSlots, setSlots, setDefances, setDefancesHistory } from "../../store/slices/slotsSlice";
import { getNextEvaluation } from "./getNextEvaluation";
import { getUserSettings } from "./getUserSettings";
import { preparationSlots } from "./preparationSlots";
import { setUser } from "../../store/slices/userSlice";
import { setAllEvents, setEvents } from "../../store/slices/eventsSlice";

export const useRefreshAgenda = ({ me, token, setLoad }: any) => {
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
            const response = await fetch(`/api/refresh_agenda?id=${me.id}&campusId=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store', // Prevent stale data if needed
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to refresh agenda: ${res.message || response.status}`);
            }

            // Update Redux store in a single batch to minimize re-renders
            dispatch(setUser(me));

            const settingsData = await getUserSettings(me.id);
            dispatch(setSavedSettings(settingsData));

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