"use client";

import { store, persistor } from "@/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/context/SocketContext";
import { ApisProvider } from "@/store/customProvider";
import { I18nProvider } from "@/lib/i18n/provider";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          <ApisProvider>
            <I18nProvider>
              {children}
              <Toaster richColors position="top-right" />
            </I18nProvider>
          </ApisProvider>
        </SocketProvider>
      </PersistGate>
    </Provider>
  );
}
