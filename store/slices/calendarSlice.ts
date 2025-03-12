import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CalendarState {
    unitType: 'month' | 'week' | 'work_week' | 'day' | 'agenda';
}

const initialState: CalendarState = {
    unitType: 'week',
};

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setUnitType(state, action: PayloadAction<any>) {
            state.unitType = action.payload;
        }
    },
});

export const { setUnitType } = calendarSlice.actions;
export default calendarSlice.reducer;