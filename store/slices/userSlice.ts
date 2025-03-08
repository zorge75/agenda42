import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    me: any | null; // Replace `any` with a proper type for your user data if available
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    me: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<any>) {
            state.me = action.payload;
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

export const { setUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;