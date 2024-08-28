import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  companiesData: [],
  headers: [],
};

export const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setCompaniesData: (state, action) => {
      state.companiesData = action.payload;
    },
    setHeaders: (state, action) => {
      state.headers = action.payload;
    },
    filterCompanies: (state) => {
      state.companiesData = state.companiesData.map((company) => ({
        ...company,
        rows: company.rows.filter((row) => row[5] === undefined || row[5] === null || row[5] === ''),
      }));
    },
  },
});

export const { setCompaniesData, setHeaders, filterCompanies } = companiesSlice.actions;

export default companiesSlice.reducer;
