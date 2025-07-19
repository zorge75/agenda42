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
        },
        addFriendToList(state, payload: PayloadAction<any>) {
            state.list = [...state.list, payload.payload]
        },
        removeFriendFromList(state, payload: PayloadAction<any>) {
            state.list = state.list.filter(friend => friend.friend_id !== payload.payload);
        },
    },
});

export const { setSavedFriends, addFriendToList, removeFriendFromList  } = userSlice.actions;
export default userSlice.reducer;