interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
      <p className="text-red-800">{message}</p>
      {onDismiss ? (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 ml-4"
          aria-label="エラーメッセージを閉じる"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}