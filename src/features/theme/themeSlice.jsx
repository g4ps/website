import { createSlice } from '@reduxjs/toolkit';

export const themeSlice = createSlice({
    name: 'theme',
    initialState: {
	value: true
    },
    reducers: {
	makeDark: state => {
	    state.value = true;
	},
        makeLight: state => {
	    state.value = false;
	},
        toggle: state => {
            state.value = !state.value;
        }
    }
});

export const { makeDark, makeLight, toggle} = themeSlice.actions;

export default themeSlice.reducer;

