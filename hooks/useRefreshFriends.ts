
import { useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setEvals } from "../store/slices/evalsSlice";
import { setOriginalSlots, setSlots, setDefances, setDefancesHistory } from "../store/slices/slotsSlice";
import { setEvents } from "../store/slices/eventsSlice";

export const useRefreshFriends = (year: any, token: any, setLoad: any) => {
    const dispatch = useDispatch();
    const isFetching = useRef(false); // Prevent concurrent fetches

    const refreshAgenda = useCallback(async () => {
        if (isFetching.current) {
            console.log('Refresh already in progress, skipping...');
            return;
        }

        if (year == 0 || !year)
            return;

        isFetching.current = true;
        try {
            setLoad(true);

            const response = await fetch(`/api/friends_mode?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store', // Prevent stale data if needed
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to refresh agenda: ${res.message || response.status}`);
            }

            dispatch(setOriginalSlots([]));
            dispatch(setSlots([]));
            dispatch(setEvals([]));
            
            if (res.events)
                dispatch(setEvents(res.events.map((event: any) => (event.event))));

            if (res.evaluations)
                dispatch(setDefances(res.evaluations));
            
            if (res.defancesHistory)
                dispatch(setDefancesHistory(res.defancesHistory));
        } catch (error) {
            console.error('Refresh Agenda Error:', error);
            // Optionally rethrow or handle error for UI feedback
        } finally {
            setLoad(false);
            isFetching.current = false;
        }
    }, [dispatch, year, token, setLoad]); // Stable dependencies

    return refreshAgenda;
};