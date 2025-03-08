import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    slots: any | null; // Replace `any` with a proper type for your user data if available
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    slots: null,
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

export const { setSlots, setLoading, setError } = slotsSlice.actions;
export default slotsSlice.reducer;