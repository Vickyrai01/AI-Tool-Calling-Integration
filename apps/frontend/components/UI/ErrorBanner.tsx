"use client";
export default function ErrorBanner({
  message,
  onClose,
}: {
  message: string;
  onClose?: () => void;
}) {
  if (!message) return null;
  return (
    <div className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 text-red-700 p-2 flex items-center justify-between">
      <span className="text-sm">{message}</span>
      {onClose && (
        <button className="text-sm underline" onClick={onClose}>
          cerrar
        </button>
      )}
    </div>
  );
}
