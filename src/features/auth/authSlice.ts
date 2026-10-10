import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { User } from '../users/types';

interface AuthState {
	user: User | null;
	signUpSuccess: boolean;
	hideBalances: boolean;
}

const initialState: AuthState = {
	user: null,
	signUpSuccess: false,
	hideBalances: false,
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setUser: (state, action) => {
			state.user = action.payload;
		},
		logOut: (state) => {
			state.user = null;
			window.location.replace('/sign-in');
		},
		setSignUpSuccess: (state, action) => {
			state.signUpSuccess = action.payload;
		},
		toggleHideBalances: (state, action) => {
			state.hideBalances = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(REHYDRATE as any, (state, action: PayloadAction<any>) => {
			const rehydratedState = action.payload?.auth;
			if (!rehydratedState) return state;

			return {
				...initialState,
				...rehydratedState,
			};
		});
	},
	selectors: {
		selectUser: (auth) => auth.user,
		selectSignUpSuccess: (auth) => auth.signUpSuccess,
		selectHideBalances: (auth) => auth.hideBalances,
	},
});

export const { setUser, logOut, setSignUpSuccess, toggleHideBalances } =
	authSlice.actions;

export const { selectUser, selectSignUpSuccess, selectHideBalances } =
	authSlice.selectors;

export const authReducer = authSlice.reducer;
