import React from "react";

export default function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        {title ? <h3 className="mb-3 text-lg font-semibold">{title}</h3> : null}
        <div className="text-sm text-gray-700">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}