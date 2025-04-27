
import React from 'react';
import { ProcessingStatus } from '../types/document';

interface ProgressBarProps {
  status: ProcessingStatus;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-primary';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'uploading':
        return `Uploading... ${Math.round(status.progress)}%`;
      case 'processing':
        return `Processing... ${Math.round(status.progress)}%`;
      case 'completed':
        return 'Completed';
      case 'error':
        return status.message || 'Error occurred';
      default:
        return '';
    }
  };

  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{getStatusText()}</span>
        <span className="text-sm font-medium text-foreground">{Math.round(status.progress)}%</span>
      </div>
      <div className="w-full h-2.5 bg-muted rounded-full">
        <div 
          className={`h-2.5 rounded-full ${getStatusColor()} transition-all duration-300`} 
          style={{ width: `${status.progress}%` }}
        ></div>
      </div>
      {status.message && status.status !== 'error' && (
        <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>
      )}
    </div>
  );
};

export default ProgressBar;
