export default function Modal({ open, onClose, onConfirm, title, description,btnName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 ">
      <div className="bg-white rounded-xl shadow-lg shadow-gray-300 p-6 w-[90%] max-w-md">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-600 mt-2">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {btnName}
          </button>
        </div>
      </div>
    </div>
  );
}
