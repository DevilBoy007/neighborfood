import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import firebaseService from '../../handlers/firebaseService';
import type { RootState } from '../store';

/**
 * Helper function to compute unread count for threads
 * A thread has unread messages if:
 * - The last message was not sent by the current user AND
 * - Either there's no lastReadBy timestamp, or it's older than the last message
 */
function calculateUnreadCounts(threads: ThreadData[], currentUserId: string): ThreadData[] {
  return threads.map((thread) => {
    // Thread is deleted by current user
    if (thread.deletedBy?.includes(currentUserId)) {
      return {
        ...thread,
        hasUnread: false,
        unreadCount: 0,
      };
    }

    // No last message or message sent by current user
    if (!thread.lastMessage?.senderId || thread.lastMessage.senderId === currentUserId) {
      return {
        ...thread,
        hasUnread: false,
        unreadCount: 0,
      };
    }

    // Check if user has read the thread after the last message
    const lastReadTimestamp = thread.lastReadBy?.[currentUserId];
    const lastMessageTimestamp = thread.lastMessage.createdAt;

    // If never read, or read before the last message, it's unread
    const hasUnread =
      !lastReadTimestamp ||
      lastReadTimestamp.seconds < lastMessageTimestamp.seconds ||
      (lastReadTimestamp.seconds === lastMessageTimestamp.seconds &&
        (lastReadTimestamp.nanoseconds || 0) < lastMessageTimestamp.nanoseconds);

    return {
      ...thread,
      hasUnread,
      unreadCount: hasUnread ? 1 : 0,
    };
  });
}

/**
 * Helper function to compute total unread count across all threads
 */
function calculateTotalUnreadCount(threads: ThreadData[]): number {
  return threads.filter((thread) => thread.hasUnread).length;
}

export type MessageType = 'text' | 'order';

export type MessageData = {
  id: string;
  senderId: string;
  type: MessageType;
  content: string;
  orderId?: string;
  orderData?: {
    id: string;
    shopName: string;
    shopPhotoURL?: string;
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    total: number;
    status: string;
    [key: string]: unknown;
  };
  createdAt: { seconds: number; nanoseconds: number };
  read: boolean;
};

export type ThreadData = {
  id: string;
  participantIds: string[];
  participantInfo: Record<string, { username: string; photoURL: string | null }>;
  lastMessage?: {
    type: string;
    content: string;
    senderId: string;
    createdAt: { seconds: number; nanoseconds: number };
  };
  updatedAt: { seconds: number; nanoseconds: number };
  createdAt?: { seconds: number; nanoseconds: number };
  deletedBy?: string[];
  lastReadBy?: Record<string, { seconds: number; nanoseconds: number }>; // Timestamp when each user last read the thread
  unreadCount?: number; // Client-side computed field
  hasUnread?: boolean; // Client-side computed field
};

type MessageState = {
  threads: ThreadData[];
  selectedThread: ThreadData | null;
  messages: MessageData[];
  isLoadingThreads: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isInitialized: boolean;
  totalUnreadCount: number;
};

const initialState: MessageState = {
  threads: [],
  selectedThread: null,
  messages: [],
  isLoadingThreads: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  isInitialized: false,
  totalUnreadCount: 0,
};

// Async thunks
export const fetchThreads = createAsyncThunk(
  'message/fetchThreads',
  async (userId: string, { rejectWithValue }) => {
    try {
      const threads = await firebaseService.getThreadsForUser(userId);
      const threadsWithUnread = calculateUnreadCounts(threads as ThreadData[], userId);
      return { threads: threadsWithUnread, userId };
    } catch (error) {
      console.error('Error fetching threads:', error);
      return rejectWithValue('Failed to fetch threads');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (threadId: string, { rejectWithValue }) => {
    try {
      const messages = await firebaseService.getMessagesForThread(threadId);
      return messages as MessageData[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return rejectWithValue('Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (
    {
      threadId,
      message,
    }: {
      threadId: string;
      message: {
        type: MessageType;
        content?: string;
        orderId?: string;
        orderData?: object;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await firebaseService.sendMessage(threadId, message);
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return rejectWithValue('Failed to send message');
    }
  }
);

export const createOrGetThread = createAsyncThunk(
  'message/createOrGetThread',
  async (
    {
      participantIds,
      initialMessage,
    }: {
      participantIds: string[];
      initialMessage?: {
        type: MessageType;
        content?: string;
        orderId?: string;
        orderData?: object;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const thread = await firebaseService.createOrGetThread(participantIds, initialMessage);
      return thread as ThreadData & { isNew: boolean };
    } catch (error) {
      console.error('Error creating or getting thread:', error);
      return rejectWithValue('Failed to create or get thread');
    }
  }
);

export const deleteThread = createAsyncThunk(
  'message/deleteThread',
  async (threadId: string, { rejectWithValue }) => {
    try {
      await firebaseService.deleteThread(threadId);
      return threadId;
    } catch (error) {
      console.error('Error deleting thread:', error);
      return rejectWithValue('Failed to delete thread');
    }
  }
);

export const markThreadAsRead = createAsyncThunk(
  'message/markThreadAsRead',
  async (threadId: string, { rejectWithValue }) => {
    try {
      await firebaseService.markThreadAsRead(threadId);
      return threadId;
    } catch (error) {
      console.error('Error marking thread as read:', error);
      return rejectWithValue('Failed to mark thread as read');
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setSelectedThread: (state, action: PayloadAction<ThreadData | null>) => {
      state.selectedThread = action.payload;
    },
    clearSelectedThread: (state) => {
      state.selectedThread = null;
      state.messages = [];
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    addMessageLocally: (state, action: PayloadAction<MessageData>) => {
      // Add message to local state for optimistic updates
      state.messages.push(action.payload);
    },
    resetMessageState: (state) => {
      state.threads = [];
      state.selectedThread = null;
      state.messages = [];
      state.isLoadingThreads = false;
      state.isLoadingMessages = false;
      state.isSendingMessage = false;
      state.isInitialized = false;
      state.totalUnreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch threads
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.isLoadingThreads = true;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.threads = action.payload.threads;
        state.totalUnreadCount = calculateTotalUnreadCount(action.payload.threads);
        state.isLoadingThreads = false;
        state.isInitialized = true;
      })
      .addCase(fetchThreads.rejected, (state) => {
        state.isLoadingThreads = false;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
        state.isLoadingMessages = false;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.isLoadingMessages = false;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        // The message is already added optimistically, but update with server response if needed
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isSendingMessage = false;
      });

    // Create or get thread
    builder
      .addCase(createOrGetThread.pending, (state) => {
        state.isLoadingThreads = true;
      })
      .addCase(createOrGetThread.fulfilled, (state, action) => {
        state.isLoadingThreads = false;
        // Add to threads if new, or update existing
        const existingIndex = state.threads.findIndex((t) => t.id === action.payload.id);
        if (existingIndex >= 0) {
          state.threads[existingIndex] = action.payload;
        } else {
          state.threads.unshift(action.payload);
        }
        state.selectedThread = action.payload;
      })
      .addCase(createOrGetThread.rejected, (state) => {
        state.isLoadingThreads = false;
      });

    // Delete thread
    builder.addCase(deleteThread.fulfilled, (state, action) => {
      state.threads = state.threads.filter((t) => t.id !== action.payload);
      if (state.selectedThread?.id === action.payload) {
        state.selectedThread = null;
        state.messages = [];
      }
    });

    // Mark thread as read
    builder.addCase(markThreadAsRead.fulfilled, (state, action) => {
      // Update local messages to mark as read
      state.messages = state.messages.map((msg) => ({
        ...msg,
        read: true,
      }));

      // Update thread's unread status
      const threadIndex = state.threads.findIndex((t) => t.id === action.payload);
      if (threadIndex >= 0) {
        state.threads[threadIndex] = {
          ...state.threads[threadIndex],
          hasUnread: false,
          unreadCount: 0,
        };
        state.totalUnreadCount = calculateTotalUnreadCount(state.threads);
      }

      // Update selected thread
      if (state.selectedThread?.id === action.payload) {
        state.selectedThread = {
          ...state.selectedThread,
          hasUnread: false,
          unreadCount: 0,
        };
      }
    });
  },
});

export const {
  setSelectedThread,
  clearSelectedThread,
  clearMessages,
  addMessageLocally,
  resetMessageState,
} = messageSlice.actions;

// Selectors
export const selectUnreadCount = (state: RootState): number => state.message.totalUnreadCount;

// Memoized selector to prevent unnecessary re-renders
// Only recalculates when threads array actually changes
export const selectThreadsWithUnread = createSelector(
  [(state: RootState) => state.message.threads],
  (threads) => threads.filter((thread) => thread.hasUnread)
);

export default messageSlice.reducer;
