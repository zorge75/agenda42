import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers'; // We'll create this next

export const store = configureStore({
    reducer: rootReducer,
    // Add middleware or enhancers if needed
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// TypeScript types for the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;