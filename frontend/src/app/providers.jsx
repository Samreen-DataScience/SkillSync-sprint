import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/app/query-client";
import { ThemeProvider, useTheme } from "@/app/providers/theme-provider";

export function AppProvider({ children }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="skillsync-ui-theme">
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return <Toaster richColors position="top-right" theme={resolvedTheme} />;
}
