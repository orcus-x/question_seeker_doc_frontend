import { Document, Question, ProcessingStatus } from '../types/document';

// API URL - change this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// More accurate mapping of backend status to frontend status
function mapBackendStatusToFrontend(status: string): ProcessingStatus['status'] {
  switch (status) {
    case 'pending':
      return 'uploading'; // Initially treat pending as uploading 
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'error';
    default:
      return 'idle';
  }
}

// Parse dates safely
function safelyParseDate(dateString: string): Date {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Return current date as fallback
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

// Get all documents
export const getAllDocuments = async (): Promise<Document[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Unexpected response format:', data);
      return [];
    }
    
    // Transform backend data to frontend Document type
    return data.data.map((doc: any) => ({
      id: doc.id,
      name: doc.name || 'Unnamed Document',
      fileUrl: doc.fileUrl || '',
      extractedText: doc.extractedText || '',
      createdAt: safelyParseDate(doc.insertedAt),
      questions: Array.isArray(doc.questions) ? doc.questions.map((q: any) => ({
        id: q.id,
        text: q.text || '',
        answer: q.answer || '', // Added answer field
        documentId: doc.id, // Ensure the document ID is set correctly
        createdAt: safelyParseDate(q.insertedAt)
      })) : []
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

// Get a single document with its questions
export const getDocument = async (documentId: string): Promise<Document | null> => {
  if (!documentId) {
    console.error('Invalid document ID provided to getDocument:', documentId);
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    const data = await response.json();
    const doc = data.data;
    
    if (!doc) {
      console.error('Document not found:', documentId);
      return null;
    }
    
    return {
      id: doc.id,
      name: doc.name || 'Unnamed Document',
      fileUrl: doc.fileUrl || '',
      extractedText: doc.extractedText || '',
      createdAt: safelyParseDate(doc.insertedAt),
      questions: Array.isArray(doc.questions) ? doc.questions.map((q: any) => ({
        id: q.id,
        text: q.text || '',
        answer: q.answer || '', // Added answer field
        documentId: doc.id, // Ensure the document ID is set correctly
        createdAt: safelyParseDate(q.insertedAt)
      })) : []
    };
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    return null;
  }
};

// Get all questions across all documents
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Unexpected response format for questions:', data);
      return [];
    }
    
    // Transform backend data to frontend Question type
    return data.data.map((q: any) => ({
      id: q.id,
      text: q.text || '',
      answer: q.answer || '', // Added answer field
      documentId: q.documentId,
      createdAt: safelyParseDate(q.insertedAt)
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

// Get questions for a specific document
export const getQuestionsForDocument = async (documentId: string): Promise<Question[]> => {
  if (!documentId) {
    console.error('Invalid document ID provided to getQuestionsForDocument');
    return [];
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/questions`);
    if (!response.ok) {
      throw new Error('Failed to fetch questions for document');
    }
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Unexpected response format for document questions:', data);
      return [];
    }
    
    return data.data.map((q: any) => ({
      id: q.id,
      text: q.text || '',
      answer: q.answer || '', // Added answer field
      documentId: documentId, // Ensure we set this correctly
      createdAt: safelyParseDate(q.insertedAt)
    }));
  } catch (error) {
    console.error(`Error fetching questions for document ${documentId}:`, error);
    return [];
  }
};

// Search questions - this will be client-side filtering
export const searchQuestions = async (query: string): Promise<Question[]> => {
  try {
    const questions = await getAllQuestions();
    if (!query) return questions;
    
    const lowerQuery = query.toLowerCase();
    return questions.filter(q => q.text.toLowerCase().includes(lowerQuery) || 
                                (q.answer && q.answer.toLowerCase().includes(lowerQuery))); // Also search in answers
  } catch (error) {
    console.error('Error searching questions:', error);
    return [];
  }
};

// Check document processing status
export const checkDocumentStatus = async (documentId: string): Promise<ProcessingStatus> => {
  if (!documentId) {
    console.error('Invalid document ID provided to checkDocumentStatus');
    return { status: 'error', progress: 0, message: 'Invalid document ID' };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch document status');
    }
    const data = await response.json();
    
    // Map backend status to frontend ProcessingStatus
    return {
      status: mapBackendStatusToFrontend(data.status),
      progress: data.progress || 0,
      message: data.message || ''
    };
  } catch (error) {
    console.error(`Error checking status for document ${documentId}:`, error);
    return { status: 'error', progress: 0, message: 'Failed to check document status' };
  }
};

// Upload and process document
export const uploadAndProcessDocument = async (
  file: File, 
  setStatus: (status: ProcessingStatus) => void
): Promise<Document | null> => {
  try {
    // Start upload
    setStatus({ status: 'uploading', progress: 0, message: 'Starting upload...' });
    
    // Create form data with file using 'upload' as the key
    const formData = new FormData();
    formData.append('upload', file);
    
    // Upload file to server
    const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('File upload failed');
    }
    
    const uploadData = await uploadResponse.json();
    
    if (!uploadData.data || !uploadData.data.id) {
      throw new Error('Invalid response from upload API');
    }
    
    const uploadId = uploadData.data.id;
    console.log('Upload ID:', uploadId);
    
    // Check if documentId is available in the response
    const documentId = uploadData.data.documentId;
    if (documentId) {
      console.log('Document ID from upload response:', documentId);
      sessionStorage.setItem('lastProcessedDocumentId', documentId);
    } else {
      // If no documentId yet, use uploadId as a fallback
      sessionStorage.setItem('lastProcessedDocumentId', uploadId);
    }
    
    // Set upload progress to 20% after initial upload
    setStatus({ 
      status: 'uploading', 
      progress: 20, 
      message: 'File uploaded. Starting document processing...' 
    });
    
    // Poll for status updates
    let processingComplete = false;
    let document: Document | null = null;
    let retryCount = 0;
    let finalDocumentId: string | null = null;
    const maxRetries = 60; // 5 minutes with 5-second intervals
    
    while (!processingComplete && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds
      retryCount++;
    
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/documents/${uploadId}/status`);
        if (!statusResponse.ok) {
          console.warn('Failed to check document status, retrying...');
          continue;
        }
      
        const statusData = await statusResponse.json();
        console.log('Status update:', statusData);
      
        // Check if the documentId is now available
        if (statusData.documentId) {
          finalDocumentId = statusData.documentId;
          console.log('Document ID from status:', finalDocumentId);
          sessionStorage.setItem('lastProcessedDocumentId', finalDocumentId);
        }
      
        // Update status based on backend data
        const frontendStatus = mapBackendStatusToFrontend(statusData.status);
        setStatus({
          status: frontendStatus,
          progress: statusData.progress || 0,
          message: statusData.message || ''
        });
      
        if (statusData.status === 'completed') {
          processingComplete = true;
          
          // Force a small delay to ensure backend processing is complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            // Use finalDocumentId if available, otherwise fall back to uploadId
            const docIdToFetch = finalDocumentId || documentId || uploadId;
            console.log("Fetching document directly with ID:", docIdToFetch);
            
            const directDoc = await getDocument(docIdToFetch);
            
            if (directDoc) {
              document = directDoc;
              console.log("Successfully fetched document:", document.id, document.name);
              
              // Verify if document has questions
              if (!document.questions || document.questions.length === 0) {
                console.log("Document has no questions, fetching from server...");
                // Document exists but has no questions, fetch them separately
                const questions = await getQuestionsForDocument(docIdToFetch);
                if (questions.length > 0) {
                  document.questions = questions;
                  console.log("Successfully added questions to document:", questions.length);
                } else {
                  console.log("No questions found for document");
                }
              }
            } else {
              console.log("Could not fetch document directly, will try to get all documents");
              
              // Fallback: Try to get all documents
              const allDocs = await getAllDocuments();
              console.log("Got documents after completion:", allDocs.length);
              
              if (allDocs.length > 0) {
                // Sort by most recently created
                allDocs.sort((a, b) => {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                
                // Find document that matches our document ID first
                let matchingDoc = allDocs.find(doc => doc.id === docIdToFetch);
                
                // If no match by ID, try filename matching
                if (!matchingDoc) {
                  matchingDoc = allDocs.find(doc => 
                    doc.name === file.name || 
                    (statusData.filename && doc.name === statusData.filename)
                  );
                }
                
                // If still no match, use the newest document
                if (!matchingDoc) {
                  matchingDoc = allDocs[0];
                }
                
                document = matchingDoc;
                console.log("Found document:", document.id, document.name);
                
                // Verify if document has questions
                if (!document.questions || document.questions.length === 0) {
                  console.log("Document has no questions, fetching from server...");
                  // Document exists but has no questions, fetch them separately
                  const questions = await getQuestionsForDocument(document.id);
                  if (questions.length > 0) {
                    document.questions = questions;
                    console.log("Successfully added questions to document:", questions.length);
                  } else {
                    console.log("No questions found for document");
                  }
                }
              }
            }
          } catch (docError) {
            console.error("Error getting document details:", docError);
          }
        } else if (statusData.status === 'failed') {
          processingComplete = true;
          setStatus({ 
            status: 'error', 
            progress: 0, 
            message: statusData.message || 'Processing failed' 
          });
        }
      } catch (error) {
        console.error('Error checking status:', error);
        // Continue polling despite errors
      }
    }
    
    if (!processingComplete) {
      setStatus({ 
        status: 'error', 
        progress: 0, 
        message: 'Processing timed out after 5 minutes' 
      });
    }
    
    return document;
  } catch (error) {
    console.error('Error processing document:', error);
    setStatus({ 
      status: 'error', 
      progress: 0, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
    return null;
  }
};