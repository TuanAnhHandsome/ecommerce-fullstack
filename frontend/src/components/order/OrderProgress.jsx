import { STEPS } from './orderConstants'

/**
 * OrderProgress
 * Thanh tiến trình trạng thái đơn hàng (6 bước).
 * Chỉ render khi currentStep >= 0 (không hiện cho CANCELLED / REFUNDED).
 */
export default function OrderProgress({ currentStep }) {
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center flex-1">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  i <= currentStep
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <i className={`fa-solid ${step.icon} text-xs`}></i>
              </div>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  i <= currentStep ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                  i < currentStep ? 'bg-red-400' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
