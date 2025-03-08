import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    evals: any | null; // Replace `any` with a proper type for your user data if available
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    evals: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setEvals(state, action: PayloadAction<any>) {
            state.evals = action.payload;
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

export const { setEvals, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;