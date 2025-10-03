import {
  createContext,
  useCallback,
  useContext,
  useMemo
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../api/client';
import type { LoginResponse, MeResponse, UserDto } from '../api/types';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_QUERY_KEY = ['auth', 'me'];

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => fetchMe(),
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      loginRequest(username, password),
    onSuccess: (response: LoginResponse) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, { user: response.user } satisfies MeResponse);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutRequest(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    }
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginMutation.mutateAsync({ username, password });
      return result;
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user ?? null,
      isLoading: isPending,
      login,
      logout
    }),
    [data?.user, isPending, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const queryClient = new QueryClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </QueryClientProvider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
