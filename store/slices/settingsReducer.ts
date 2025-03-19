import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    slotRemoveMod: boolean;
}

const initialState: UserState = {
    slotRemoveMod: false,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setSlotsMod(state, action: PayloadAction<any>) {
            state.slotRemoveMod = action.payload;
        },
    },
});

export const { setSlotsMod } = userSlice.actions;
export default userSlice.reducer;