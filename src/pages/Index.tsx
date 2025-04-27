import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from '@/components/FileUpload';
import QuestionsList from '@/components/QuestionsList';
import AllQuestions from '@/components/AllQuestions';
import { getAllDocuments, getDocument } from '@/services/documentService';
import { Document } from '@/types/document';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [latestDocument, setLatestDocument] = useState<Document | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [documentMap, setDocumentMap] = useState<Record<string, Document>>({});

  // Function to fetch the last processed document with questions
  const lastQuestions = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      console.log("Fetching documents for questions...");
      
      // Check if there's a most recently processed document ID in session storage
      const lastProcessedId = sessionStorage.getItem('lastProcessedDocumentId');
      
      if (lastProcessedId) {
        console.log("Found lastProcessedDocumentId:", lastProcessedId);
        
        try {
          // Directly fetch the specific document with its questions
          const fullDoc = await getDocument(lastProcessedId);
          if (fullDoc) {
            console.log("Got document with questions:", 
              fullDoc.questions ? fullDoc.questions.length : 0);
            setLatestDocument(fullDoc);
            
            // Update document map with this document for efficient lookups
            setDocumentMap(prevMap => ({
              ...prevMap,
              [fullDoc.id]: fullDoc
            }));
            
            if (showLoading) {
              setLoading(false);
            }
            return;
          }
        } catch (err) {
          console.error("Error fetching specific document:", err);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Initial load only - not on refreshTrigger changes
  useEffect(() => {
    lastQuestions();
  }, []); // No dependency on refreshTrigger

  const handleProcessingComplete = (success: boolean) => {
    if (success) {
      console.log("Processing complete, switching to results tab...");
      // First switch to the results tab
      setActiveTab('results');
      
      // Then fetch the document data directly (don't use the trigger)
      lastQuestions(false); // Don't show loading since we're coming from processing
    }
  };

  // Handle refresh button click - clear document and session storage
  const handleRefresh = () => {
    // Clear the lastProcessedDocumentId from session storage
    sessionStorage.removeItem('lastProcessedDocumentId');
    
    // Clear the displayed document
    setLatestDocument(null);
    
    // Clear the document map
    setDocumentMap({});
    
    // Refresh fetch
    lastQuestions();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Intelligent Document Question Extractor
          </h1>
          <p className="mt-2 text-gray-600">
            Upload PDF documents and extract questions automatically
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="border-b px-6 py-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload Document</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="all-questions">All Questions</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="upload" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">Upload a Document</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a PDF document to extract questions using OCR technology
                      </p>
                    </div>

                    <FileUpload onProcessingComplete={handleProcessingComplete} />
                  </div>
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">Extracted Questions</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          {latestDocument 
                            ? `Questions extracted from ${latestDocument.name}`
                            : 'No documents have been processed yet'}
                        </p>
                      </div>
                      
                      {latestDocument && (
                        <button
                          onClick={handleRefresh}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          Refresh
                        </button>
                      )}
                    </div>

                    {loading ? (
                      <div className="py-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="mt-2 text-gray-600">Loading document...</p>
                      </div>
                    ) : latestDocument ? (
                      <>
                        {(!latestDocument.questions || latestDocument.questions.length === 0) ? (
                          <div className="py-8 text-center">
                            <p className="text-gray-500">
                              No questions were extracted from this document.
                            </p>
                          </div>
                        ) : (
                          <QuestionsList 
                            questions={latestDocument.questions}
                            documentName={latestDocument.name}
                            documentMap={documentMap}
                          />
                        )}
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">
                          No results yet. Upload a document to see extracted questions.
                        </p>
                        <button
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={() => setActiveTab('upload')}
                        >
                          Upload a Document
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="all-questions" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">All Questions</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        View and search all questions extracted from your documents
                      </p>
                    </div>

                    <AllQuestions documentMap={documentMap} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Intelligent Document Question Extractor &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;