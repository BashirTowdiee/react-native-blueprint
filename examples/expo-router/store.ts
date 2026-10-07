import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth slice
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  lastLogin: string | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  username: null,
  lastLogin: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ username: string; timestamp: string }>,
    ) => {
      state.isAuthenticated = true;
      state.username = action.payload.username;
      state.lastLogin = action.payload.timestamp;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.username = null;
      state.lastLogin = null;
    },
  },
});

// Stories slice
interface Story {
  id: string;
  title: string;
  coverImage: string;
  date: string;
  jlptLevel: string;
}

interface StoriesState {
  stories: Story[];
  lastFetched: string | null;
}

const initialStoriesState: StoriesState = {
  stories: [],
  lastFetched: null,
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState: initialStoriesState,
  reducers: {
    setStories: (state, action: PayloadAction<Story[]>) => {
      state.stories = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    addStory: (state, action: PayloadAction<Story>) => {
      state.stories.push(action.payload);
    },
    removeStory: (state, action: PayloadAction<string>) => {
      state.stories = state.stories.filter(
        (story) => story.id !== action.payload,
      );
    },
  },
});

// Study progress slice
interface StudyProgress {
  [storyId: string]: {
    lastStudied: string;
    completedWords: string[];
    learningWords: string[];
  };
}

interface StudyState {
  progress: StudyProgress;
}

const initialStudyState: StudyState = {
  progress: {},
};

const studySlice = createSlice({
  name: 'study',
  initialState: initialStudyState,
  reducers: {
    updateProgress: (
      state,
      action: PayloadAction<{
        storyId: string;
        wordId: string;
        status: 'completed' | 'learning';
      }>,
    ) => {
      const { storyId, wordId, status } = action.payload;

      // Initialize story progress if it doesn't exist
      if (!state.progress[storyId]) {
        state.progress[storyId] = {
          lastStudied: new Date().toISOString(),
          completedWords: [],
          learningWords: [],
        };
      }

      // Update the appropriate list
      if (status === 'completed') {
        if (!state.progress[storyId].completedWords.includes(wordId)) {
          state.progress[storyId].completedWords.push(wordId);
        }
        // Remove from learning words if it was there
        state.progress[storyId].learningWords = state.progress[
          storyId
        ].learningWords.filter((id) => id !== wordId);
      } else {
        if (!state.progress[storyId].learningWords.includes(wordId)) {
          state.progress[storyId].learningWords.push(wordId);
        }
        // Remove from completed words if it was there
        state.progress[storyId].completedWords = state.progress[
          storyId
        ].completedWords.filter((id) => id !== wordId);
      }

      // Update last studied timestamp
      state.progress[storyId].lastStudied = new Date().toISOString();
    },
    resetProgress: (state, action: PayloadAction<string>) => {
      // Reset progress for a specific story
      const storyId = action.payload;
      if (state.progress[storyId]) {
        state.progress[storyId] = {
          lastStudied: new Date().toISOString(),
          completedWords: [],
          learningWords: [],
        };
      }
    },
  },
});

// Combine reducers
const rootReducer = {
  auth: authSlice.reducer,
  stories: storiesSlice.reducer,
  study: studySlice.reducer,
};

// Configure persistence
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'study'], // We'll only persist auth and study progress
};

const persistedReducer = persistReducer(
  persistConfig,
  (state: any = {}, action) => {
    return {
      auth: authSlice.reducer(state.auth, action),
      stories: storiesSlice.reducer(state.stories, action),
      study: studySlice.reducer(state.study, action),
    };
  },
);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// Export actions
export const { login, logout } = authSlice.actions;
export const { setStories, addStory, removeStory } = storiesSlice.actions;
export const { updateProgress, resetProgress } = studySlice.actions;

// Export selectors
export const selectAuth = (state: any) => state.auth;
export const selectStories = (state: any) => state.stories.stories;
export const selectStudyProgress = (state: any) => state.study.progress;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
