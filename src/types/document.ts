export interface Document {
  id: string;
  name: string;
  fileUrl: string;
  extractedText?: string;
  createdAt: Date;
  questions?: Question[];
}

export interface Question {
  id: string;
  text: string;
  answer?: string;
  documentId: string;
  createdAt: Date;
}

export type ProcessingStatus = {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
};