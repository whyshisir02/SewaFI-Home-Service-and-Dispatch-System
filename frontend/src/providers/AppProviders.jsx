import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { SocketProvider } from './SocketProvider';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
