import React, { useState, useEffect } from 'react';
import { Question, Document } from '../types/document';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getDocument } from '../services/documentService';

interface QuestionsListProps {
  questions: Question[];
  showDocumentName?: boolean;
  documentName?: string;
  documentMap?: Record<string, Document>;
  emptyMessage?: string;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ 
  questions, 
  showDocumentName = false,
  documentName,
  documentMap = {},
  emptyMessage = "No questions found" 
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});

  // Initialize document names from the document map
  useEffect(() => {
    if (Object.keys(documentMap).length > 0) {
      const names: Record<string, string> = {};
      Object.entries(documentMap).forEach(([id, doc]) => {
        names[id] = doc.name;
      });
      setDocumentNames(names);
    }
  }, [documentMap]);

  // Fetch any missing document names
  useEffect(() => {
    const fetchMissingDocumentNames = async () => {
      // Filter out undefined and empty document IDs
      const validDocIds = questions
        .map(q => q.documentId)
        .filter(id => id && id !== undefined && id !== '' && !documentNames[id] && !documentMap[id]);
      
      // Create a Set to remove duplicates
      const docIds = new Set(validDocIds);
      
      if (docIds.size === 0) return;
      
      const names: Record<string, string> = {...documentNames};
      
      for (const docId of docIds) {
        try {
          const doc = await getDocument(docId);
          if (doc) {
            names[docId] = doc.name;
          }
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
        }
      }
      
      setDocumentNames(names);
    };
    
    if (showDocumentName && questions.length > 0) {
      fetchMissingDocumentNames();
    }
  }, [questions, showDocumentName, documentNames, documentMap]);

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Get document name from various sources
  const getDocumentName = (documentId: string) => {
    // Check if documentId is valid
    if (!documentId) {
      return 'Unknown Document';
    }
    
    // First try the document map
    if (documentMap[documentId]) {
      return documentMap[documentId].name;
    }
    
    // Then try the cached document names
    if (documentNames[documentId]) {
      return documentNames[documentId];
    }
    
    // Fall back to the provided document name or just the ID
    return documentName || `Document ${documentId}`;
  };

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {documentName && !showDocumentName && (
        <h3 className="font-medium text-foreground mb-2">{documentName}</h3>
      )}
      
      <ul className="space-y-3">
        {questions.map((question) => (
          <li 
            key={question.id} 
            className="border rounded-lg overflow-hidden bg-card hover:shadow-sm transition-shadow"
          >
            <button
              className="w-full px-4 py-3 text-left flex items-center justify-between focus:outline-none"
              onClick={() => toggleExpand(question.id)}
            >
              <div className="flex-grow">
                <p className="font-medium text-card-foreground">{question.text}</p>
                {showDocumentName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    From: {getDocumentName(question.documentId)}
                  </p>
                )}
              </div>
              
              {expandedQuestions.has(question.id) ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedQuestions.has(question.id) && (
              <div className="px-4 py-3 bg-accent/10 border-t">
                <h4 className="font-medium text-accent-foreground mb-2">Answer:</h4>
                <p className="text-sm text-card-foreground">
                  {question.answer || "No answer available for this question."}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionsList;