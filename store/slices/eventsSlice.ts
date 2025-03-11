import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EventsState {
    events: any | null; // Replace `any` with a proper type for your user data if available
    loading: boolean;
    error: string | null;
}

const initialState: EventsState = {
    events: null,
    loading: false,
    error: null,
};

const eventsSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        setEvents(state, action: PayloadAction<any>) {
            state.events = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setError(state, action: PayloadAction<string>) {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const { setEvents, setLoading, setError } = eventsSlice.actions;
export default eventsSlice.reducer;