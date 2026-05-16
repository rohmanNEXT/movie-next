"use client";

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster 
      position="top-center" 
      expand={false}
      visibleToasts={3}
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast: "!bg-white/15 !backdrop-blur-2xl !border !border-white/20 !text-white/90 !rounded-2xl !px-4 !py-3 !shadow-2xl flex items-center gap-2 font-medium w-full !pr-12",
          closeButton: "!bg-white/15 !border-white/20 hover:!bg-white/20 !text-white !left-auto !right-3 !top-1/2 !-translate-y-1/2 !opacity-100 !transition-all",
          description: "text-gray-300 text-xs",
        }
      }}
    />
  );
}
