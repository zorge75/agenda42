import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    pointsForPinned: number;
    slotRemoveMod: boolean;
    settingsIsOpen: boolean;
    piscineIsOpen: boolean;
    friendsIsOpen: boolean;
    wavingHandIsOpen: boolean;
    settingsLoaded: any;
}

const initialState: UserState = {
    pointsForPinned: 4,
    slotRemoveMod: false,
    settingsIsOpen: false,
    friendsIsOpen: false,
    piscineIsOpen: false,
    wavingHandIsOpen: false,
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
        setModalWavingHandStatus(state, action: PayloadAction<any>) {
            state.wavingHandIsOpen = action.payload;
        },
        setSavedSettings(state, action: PayloadAction<any>) {
            state.settingsLoaded = action.payload;
        },
    },
});

export const { setSlotsMod, setModalPiscineStatus, setModalSettingsStatus, setModalFriendsStatus, setModalWavingHandStatus, setSavedSettings } = userSlice.actions;
export default userSlice.reducer;