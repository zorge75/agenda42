import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    slotRemoveMod: boolean;
    settingsIsOpen: boolean;
    piscineIsOpen: boolean;
    friendsIsOpen: boolean;
    settingsLoaded: any;
}

const initialState: UserState = {
    slotRemoveMod: false,
    settingsIsOpen: false,
    friendsIsOpen: false,
    piscineIsOpen: false,
    settingsLoaded: null,
};

const userSlice = createSlice({
    name: 'settinds',
    initialState,
    reducers: {
        setSlotsMod(state, action: PayloadAction<any>) {
            state.slotRemoveMod = action.payload;
        },
        setModalSettingsStatus(state, action: PayloadAction<any>) {
            state.settingsIsOpen = action.payload;
        },
        setModalPiscineStatus(state, action: PayloadAction<any>) {
            state.piscineIsOpen = action.payload;
        },
        setModalFriendsStatus(state, action: PayloadAction<any>) {
            state.friendsIsOpen = action.payload;
        },
        setSavedSettings(state, action: PayloadAction<any>) {
            state.settingsLoaded = action.payload;
        },
    },
});

export const { setSlotsMod, setModalPiscineStatus, setModalSettingsStatus, setModalFriendsStatus, setSavedSettings } = userSlice.actions;
export default userSlice.reducer;