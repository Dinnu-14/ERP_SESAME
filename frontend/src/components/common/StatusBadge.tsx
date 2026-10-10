import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'PASSED':
      case 'PAID':
      case 'ACTIVE':
      case 'PRESENT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DISPATCHED':
      case 'IN_PROGRESS':
      case 'PARTIALLY_RECEIVED':
      case 'PARTIALLY_PAID':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'REQUESTED':
      case 'SUBMITTED':
      case 'PENDING':
      case 'QUALITY_CHECK':
      case 'PLANNED':
      case 'DRAFT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'FLAGGED':
      case 'REJECTED':
      case 'OVERDUE':
      case 'CANCELLED':
      case 'ABSENT':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
