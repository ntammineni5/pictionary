'use client';

interface TimerProps {
  seconds: number;
  isActive: boolean;
}

export default function Timer({ seconds, isActive }: TimerProps) {
  const percentage = (seconds / 60) * 100;
  const isLowTime = seconds <= 10;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Time Remaining</span>
        <span
          className={`text-3xl font-bold ${
            isLowTime ? 'text-red-500 animate-pulse' : 'text-primary-600'
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLowTime ? 'bg-red-500' : 'bg-primary-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
