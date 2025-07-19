import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    slotRemoveMod: boolean;
    settingsIsOpen: boolean;
    piscineIsOpen: boolean;
    settingsLoaded: any;
}

const initialState: UserState = {
    slotRemoveMod: false,
    settingsIsOpen: false,
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
        setSavedSettings(state, action: PayloadAction<any>) {
            state.settingsLoaded = action.payload;
        },
    },
});

export const { setSlotsMod, setModalPiscineStatus, setModalSettingsStatus, setSavedSettings } = userSlice.actions;
export default userSlice.reducer;