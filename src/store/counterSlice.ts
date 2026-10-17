import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import type { InitialState, User, UserInput } from "../components/types";
import type { RootState } from "./store";
import { api } from "../utilit/app";

const PAGE_SIZE = 100;

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? "An error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

export const fetchUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string; state: RootState }
>(
  "counter/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const users: User[] = [];
      let page = 1;

      while (true) {
        const response = await axios.get<User[]>(api, {
          params: { page, limit: PAGE_SIZE },
        });

        if (!Array.isArray(response.data)) {
          throw new Error("The API response is not a list of users.");
        }

        users.push(...response.data);

        if (response.data.length < PAGE_SIZE) {
          return users;
        }

        page += 1;
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => !getState().counter.loading,
  },
);

export const deleteUser = createAsyncThunk<
  string | number,
  string | number,
  { rejectValue: string }
>("counter/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${api}/${encodeURIComponent(String(id))}`);
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const addUser = createAsyncThunk<
  User,
  UserInput,
  { rejectValue: string }
>("counter/addUser", async (user, { rejectWithValue }) => {
  try {
    const response = await axios.post<User>(api, user);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateUser = createAsyncThunk<
  { id: string | number; user: User },
  { id: string | number; user: UserInput },
  { rejectValue: string }
>("counter/updateUser", async ({ id, user }, { rejectWithValue }) => {
  try {
    const response = await axios.put<User>(
      `${api}/${encodeURIComponent(String(id))}`,
      user,
    );
    return { id, user: { ...response.data, id } };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const initialState: InitialState = {
  users: [],
  loading: false,
  deletingUserIds: [],
  error: null,
};

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.users = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch users";
      });

    builder
      .addCase(deleteUser.pending, (state, action) => {
        const id = String(action.meta.arg);
        if (!state.deletingUserIds.includes(id)) {
          state.deletingUserIds.push(id);
        }
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const id = String(action.payload);
        state.users = state.users.filter(
          (user) => String(user.id) !== id,
        );
        state.deletingUserIds = state.deletingUserIds.filter(
          (deletingId) => deletingId !== id,
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        const id = String(action.meta.arg);
        state.deletingUserIds = state.deletingUserIds.filter(
          (deletingId) => deletingId !== id,
        );
        state.error = action.payload ?? "Failed to delete user";
      });

    builder
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const userIndex = state.users.findIndex(
          (user) => String(user.id) === String(action.payload.id),
        );
        if (userIndex !== -1) {
          state.users[userIndex] = action.payload.user;
        }
      });
  },
});

export const { clearUsers } = counterSlice.actions;
export default counterSlice.reducer;  