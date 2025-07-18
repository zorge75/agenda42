import { combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import evalsReducer from './slices/evalsSlice';
import slotsReducer from './slices/slotsSlice';
import eventsReducer from './slices/eventsSlice';
import calendarReducer from './slices/calendarSlice';
import settingsReducer from './slices/settingsReducer';
import friendsReducer from './slices/friendsReducer';

const rootReducer = combineReducers({
    settings: settingsReducer,
    user: userReducer, // Add your reducers here
    evals: evalsReducer,
    slots: slotsReducer,
    events: eventsReducer,
    calendar: calendarReducer,
    friends: friendsReducer,
});

export default rootReducer;