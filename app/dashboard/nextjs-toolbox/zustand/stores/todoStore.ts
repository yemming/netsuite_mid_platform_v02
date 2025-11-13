import { create } from 'zustand';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoState {
  todos: Todo[];
  loading: boolean;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  fetchTodos: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  addTodo: (text) =>
    set((state) => ({
      todos: [
        ...state.todos,
        {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date(),
        },
      ],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
  deleteTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      todos: state.todos.filter((todo) => !todo.completed),
    })),
  fetchTodos: async () => {
    set({ loading: true });
    // 模擬 API 調用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({
      todos: [
        { id: '1', text: '學習 Zustand', completed: true, createdAt: new Date() },
        { id: '2', text: '實作狀態管理', completed: false, createdAt: new Date() },
        { id: '3', text: '測試應用程式', completed: false, createdAt: new Date() },
      ],
      loading: false,
    });
  },
}));

