import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/theme/themeSlice.jsx';

export default configureStore({
    reducer: {
	theme: themeReducer
    }
})
