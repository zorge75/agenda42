import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    list: any;
}

const initialState: UserState = {
    list: [],
};

const userSlice = createSlice({
    name: 'settinds',
    initialState,
    reducers: {
        setSavedFriends(state, action: PayloadAction<any>) {
            state.list = action.payload?.data;
        }
    },
});

export const { setSavedFriends } = userSlice.actions;
export default userSlice.reducer;