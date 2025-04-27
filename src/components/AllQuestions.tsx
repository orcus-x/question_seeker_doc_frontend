import React, { useState, useEffect } from 'react';
import { Question, Document } from '../types/document';
import QuestionsList from './QuestionsList';
import SearchBar from './SearchBar';
import { getAllQuestions, searchQuestions, getAllDocuments } from '../services/documentService';

interface AllQuestionsProps {
  documentMap?: Record<string, Document>;
}

const AllQuestions: React.FC<AllQuestionsProps> = ({ documentMap = {} }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [localDocumentMap, setLocalDocumentMap] = useState<Record<string, Document>>(documentMap);

  // Fetch documents to map IDs to names if no documentMap is provided
  useEffect(() => {
    // If documentMap is provided and not empty, use it
    if (Object.keys(documentMap).length > 0) {
      setLocalDocumentMap(documentMap);
      return;
    }
    
    const fetchDocuments = async () => {
      try {
        const docs = await getAllDocuments();
        const map: Record<string, Document> = {};
        docs.forEach(doc => {
          map[doc.id] = doc;
        });
        setLocalDocumentMap(map);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };
    
    fetchDocuments();
  }, [documentMap]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const allQuestions = searchQuery 
          ? await searchQuestions(searchQuery)
          : await getAllQuestions();
        
        // Sort by creation date (newest first)
        const sortedQuestions = [...allQuestions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQuestions(sortedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [searchQuery]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search all questions..."
        />
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading questions...</p>
        </div>
      ) : (
        <QuestionsList 
          questions={questions} 
          showDocumentName={true}
          documentMap={localDocumentMap}
          emptyMessage={
            searchQuery 
              ? `No questions found matching "${searchQuery}"`
              : "No questions found. Upload a document to extract questions."
          }
        />
      )}
    </div>
  );
};

export default AllQuestions;