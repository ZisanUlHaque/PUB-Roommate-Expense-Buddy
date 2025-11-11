import React, { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext({ show: () => {}, remove: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, title: "", desc: "", status: "info", duration: 3000, ...opts };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => remove(id), t.duration);
    return id;
  }, [remove]);

  return (
    <ToastCtx.Provider value={{ show, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-sm rounded-lg border bg-white p-3 shadow-lg ${
              t.status === "success" ? "border-green-200" : t.status === "error" ? "border-red-200" : "border-gray-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${
                t.status === "success" ? "bg-green-600" : t.status === "error" ? "bg-red-600" : "bg-sky-600"
              }`} />
              <div>
                {t.title ? <div className="font-medium">{t.title}</div> : null}
                <div className="text-sm text-gray-700">{t.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);