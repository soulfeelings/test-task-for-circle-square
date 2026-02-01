import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "@shared/types/api";
import { apiClient } from "@shared/api/client";
import GlobalLoader from "@shared/components/GlobalLoader";

interface UserContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "guss_game_user";
const USERNAME_STORAGE_KEY = "guss_game_username";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Восстановление пользователя из localStorage при загрузке
  useEffect(() => {
    const restoreUser = async () => {
      const startTime = Date.now();
      const minLoadingTime = 2000; // Минимум 2 секунды загрузки

      try {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);

        if (savedUser && savedUsername) {
          apiClient.setUsername(savedUsername);

          // Проверяем, что пользователь все еще валиден
          try {
            const currentUser = await apiClient.getMe();
            setUser(currentUser);
          } catch (error) {
            // Если пользователь не валиден, очищаем localStorage
            console.error("Saved user is no longer valid:", error);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(USERNAME_STORAGE_KEY);
            apiClient.setUsername("");
          }
        }
      } catch (error) {
        console.error("Error restoring user:", error);
        // Очищаем поврежденные данные
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(USERNAME_STORAGE_KEY);
        apiClient.setUsername("");
      } finally {
        // Обеспечиваем минимум 2 секунды загрузки
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    restoreUser();
  }, []);

  const login = async (username: string) => {
    setIsLoading(true);
    try {
      const userData = await apiClient.login(username);
      apiClient.setUsername(username);
      setUser(userData);

      // Сохраняем данные в localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(USERNAME_STORAGE_KEY, username);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.setUsername("");

    // Очищаем localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USERNAME_STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {isLoading ? <GlobalLoader /> : children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
