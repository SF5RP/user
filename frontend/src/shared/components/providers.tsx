"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppStore, makeStore } from "@/shared/lib/store";
import { ThemeProvider } from "@/shared/contexts/themeContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={queryClientRef.current}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
};

