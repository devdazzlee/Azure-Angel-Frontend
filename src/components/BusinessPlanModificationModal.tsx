import { useState } from 'react';
import { BUSINESS_PLAN_MODIFICATION_AREAS } from '../constants/businessPlanModificationAreas';

interface BusinessPlanModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedAreaIds: string[]) => void;
  loading?: boolean;
}

export default function BusinessPlanModificationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: BusinessPlanModificationModalProps) {
  const [selectedModifications, setSelectedModifications] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleArea = (areaId: string) => {
    setSelectedModifications((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const handleConfirm = () => {
    if (selectedModifications.length === 0) return;
    onConfirm(selectedModifications);
    setSelectedModifications([]);
  };

  const handleCancel = () => {
    setSelectedModifications([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Select Areas to Modify</h2>
          <p className="text-gray-600">
            Choose which sections of your business plan need adjustment. Angel will guide you through
            each selected area.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {BUSINESS_PLAN_MODIFICATION_AREAS.map((area) => {
              const isSelected = selectedModifications.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id)}
                  disabled={loading}
                  className={`rounded-lg border-2 p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-gray-900">{area.title}</h3>
                      <p className="mb-2 text-sm text-gray-600">{area.description}</p>
                      <div className="space-y-1">
                        {area.questions.map((question) => (
                          <p key={question} className="text-xs text-gray-500">
                            • {question}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedModifications.length > 0 && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">Selected areas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedModifications.map((areaId) => {
                  const area = BUSINESS_PLAN_MODIFICATION_AREAS.find((item) => item.id === areaId);
                  return (
                    <span
                      key={areaId}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {area?.title}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || selectedModifications.length === 0}
              className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Preparing…' : `Proceed with modifications (${selectedModifications.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
