import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  isLoading: false,
  sidebarOpen: true,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setLoading,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
