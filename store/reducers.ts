import { combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import evalsReducer from './slices/evalsSlice';
import slotsReducer from './slices/slotsSlice';
import eventsReducer from './slices/eventsSlice';

const rootReducer = combineReducers({
    user: userReducer, // Add your reducers here
    evals: evalsReducer,
    slots: slotsReducer,
    events: eventsReducer,
});

export default rootReducer;