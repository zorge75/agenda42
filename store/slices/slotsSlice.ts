import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    slots: any | null; // Replace `any` with a proper type for your user data if available
    original: any | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    slots: null,
    original: null,
    loading: false,
    error: null,
};

const slotsSlice = createSlice({
    name: 'slots',
    initialState,
    reducers: {
        setSlots(state, action: PayloadAction<any>) {
            state.slots = action.payload;
            state.loading = false;
            state.error = null;
        },
        setOriginalSlots(state, action: PayloadAction<any>) {
            state.slots = state.slots;
            state.original = action.payload;
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

export const { setSlots, setOriginalSlots, setLoading, setError } = slotsSlice.actions;
export default slotsSlice.reducer;