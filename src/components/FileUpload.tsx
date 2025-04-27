import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ProcessingStatus } from '../types/document';
import { uploadAndProcessDocument } from '../services/documentService';
import ProgressBar from './ProgressBar';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onProcessingComplete: (success: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onProcessingComplete }) => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported at this time.');
      return;
    }
    
    try {
      // Reset status before starting
      setProcessingStatus({
        status: 'uploading',
        progress: 0,
        message: 'Starting upload...'
      });
      
      const result = await uploadAndProcessDocument(file, setProcessingStatus);
      
      if (result) {
        // Store the document ID for reference
        const documentId = result.id;
        console.log("Processing complete for document ID:", documentId);
        
        // Save to session storage for the Index component to find
        try {
          sessionStorage.setItem('lastProcessedDocumentId', documentId);
        } catch (e) {
          console.warn("Could not save document ID to session storage", e);
        }
        
        // Set status to completed
        setProcessingStatus({
          status: 'completed',
          progress: 100,
          message: 'Document processed successfully!'
        });
        
        toast.success('Document processed successfully!');
        
        // Simply notify the parent component for tab switching
        setTimeout(() => {
          onProcessingComplete(true);
        }, 1000);
      } else {
        if (processingStatus.status === 'error') {
          toast.error(processingStatus.message || 'Failed to process document.');
        } else {
          toast.error('Failed to process document.');
        }
        onProcessingComplete(false);
      }
    } catch (error) {
      console.error('Error in file processing:', error);
      toast.error('An unexpected error occurred.');
      setProcessingStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      onProcessingComplete(false);
    }
  }, [onProcessingComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled: processingStatus.status === 'uploading' || processingStatus.status === 'processing',
    maxFiles: 1
  });

  const isProcessing = processingStatus.status === 'uploading' || processingStatus.status === 'processing';
  const isError = processingStatus.status === 'error';
  const isCompleted = processingStatus.status === 'completed';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:bg-accent/10'}
          ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}
          ${isError ? 'border-destructive/40 bg-destructive/10' : ''}
          ${isCompleted ? 'border-green-500/40 bg-green-500/10' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isDragActive ? (
            <Upload className="h-12 w-12 text-primary" />
          ) : isError ? (
            <AlertCircle className="h-12 w-12 text-destructive" />
          ) : isCompleted ? (
            <FileText className="h-12 w-12 text-green-500" />
          ) : (
            <FileText className="h-12 w-12 text-muted-foreground" />
          )}
          
          <div className="space-y-1 text-center">
            <p className="text-lg font-medium text-foreground">
              {isDragActive ? 'Drop the PDF here' : 
               isError ? 'Upload failed' : 
               isCompleted ? 'Document processed successfully' :
               isProcessing ? 'Processing file...' : 
               'Drag & drop your PDF here'}
            </p>
            {!isProcessing && !isCompleted && (
              <p className="text-sm text-muted-foreground">
                or <span className="text-primary font-medium">browse files</span>
              </p>
            )}
            {!isProcessing && !isError && !isCompleted && (
              <p className="text-xs text-muted-foreground mt-2">
                Only PDF files are supported
              </p>
            )}
            {isError && processingStatus.message && (
              <p className="text-sm text-destructive mt-2">
                {processingStatus.message}
              </p>
            )}
            {isCompleted && (
              <p className="text-sm text-green-500 mt-2">
                Showing results...
              </p>
            )}
          </div>
        </div>
      </div>
      
      <ProgressBar status={processingStatus} />
      
      {isProcessing && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Please don't close this page while your document is being processed
        </p>
      )}
      
      {isError && (
        <div className="mt-4 flex justify-center">
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            onClick={() => setProcessingStatus({ status: 'idle', progress: 0 })}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;