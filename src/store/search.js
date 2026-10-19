import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { extractBrands, extractOffers, requestGoods } from '../api/parts';

const emptyRequest = () => ({ items: [], status: 'idle', error: '', requestId: null });

const initialState = {
  apiKey: '',
  number: '',
  selectedBrand: '',
  brands: emptyRequest(),
  offers: emptyRequest(),
};

export const fetchBrands = createAsyncThunk('search/brands', async (number, { getState, signal }) => {
  const goods = await requestGoods({ key: getState().search.apiKey, number, signal });
  return extractBrands(goods);
});

export const fetchOffers = createAsyncThunk('search/offers', async ({ number, brand }, { getState, signal }) => {
  const goods = await requestGoods({ key: getState().search.apiKey, number, brand, signal });
  return extractOffers(goods);
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setApiKey(state, action) {
      if (state.apiKey === action.payload.trim()) return;
      state.apiKey = action.payload.trim();
      state.selectedBrand = '';
      state.brands = emptyRequest();
      state.offers = emptyRequest();
    },
    setNumber(state, action) {
      state.number = action.payload;
      state.selectedBrand = '';
      state.brands = emptyRequest();
      state.offers = emptyRequest();
    },
    selectBrand(state, action) {
      if (state.selectedBrand === action.payload) return;
      state.selectedBrand = action.payload;
      state.offers = emptyRequest();
    },
  },
  extraReducers(builder) {
    for (const [thunk, field] of [[fetchBrands, 'brands'], [fetchOffers, 'offers']]) {
      builder
        .addCase(thunk.pending, (state, action) => {
          state[field] = { items: [], status: 'loading', error: '', requestId: action.meta.requestId };
          if (field === 'brands') {
            state.selectedBrand = '';
            state.offers = emptyRequest();
          }
        })
        .addCase(thunk.fulfilled, (state, action) => {
          if (state[field].requestId !== action.meta.requestId) return;
          state[field] = { items: action.payload, status: 'success', error: '', requestId: null };
        })
        .addCase(thunk.rejected, (state, action) => {
          if (state[field].requestId !== action.meta.requestId) return;
          state[field] = {
            items: [],
            status: action.meta.aborted ? 'idle' : 'error',
            error: action.meta.aborted ? '' : action.error.message || 'Не удалось загрузить данные.',
            requestId: null,
          };
        });
    }
  },
});

export const { setApiKey, setNumber, selectBrand } = searchSlice.actions;

export function createAppStore() {
  return configureStore({ reducer: { search: searchSlice.reducer }, devTools: false });
}
