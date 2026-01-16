import { useState, useEffect } from 'react';
import { QueryBar } from './components/QueryBar';
import { AnswerDisplay } from './components/AnswerDisplay';
import { ContextCard } from './components/ContextCard';
import { DocumentUpload } from './components/DocumentUpload';
import { policyApi } from './services/api';
import { QueryResponse, Stats } from './types';

function App() {
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await policyApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Set default stats if backend is not reachable
      setStats({ total_chunks: 0, class_name: 'PolicySegment' });
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await policyApi.query(query);
      setQueryResponse(response);
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // Reload stats after successful upload
    loadStats();
    // Close upload modal after a delay
    setTimeout(() => {
      setShowUpload(false);
    }, 2000);
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all indexed data? This action cannot be undone.')) {
      return;
    }

    try {
      await policyApi.clearData();
      // Reload stats after clearing
      await loadStats();
      // Clear any existing query results
      setQueryResponse(null);
      alert('All data cleared successfully!');
    } catch (err) {
      console.error('Failed to clear data:', err);
      alert('Failed to clear data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PolicyProbe V2</h1>
              <p className="text-sm text-gray-600 mt-1">
                High-Fidelity Structural Knowledge Retrieval
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Document
                </span>
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear All Data
                </span>
              </button>
              {stats && stats.total_chunks !== undefined && (
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Indexed Chunks
                  </div>
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.total_chunks.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Document Section */}
        {showUpload && (
          <div className="mb-8">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Query Bar */}
        <div className="mb-8">
          <QueryBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800">Error</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
          </div>
        )}

        {/* Results */}
        {queryResponse && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Answer */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <AnswerDisplay
                  answer={queryResponse.final_answer}
                  contextCount={queryResponse.retrieved_context.length}
                />
              </div>
            </div>

            {/* Right Column - Context Sources */}
            <div className="lg:col-span-3">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Retrieved Context Sources
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  These structural segments informed the generated answer
                </p>
              </div>

              <div className="space-y-4">
                {queryResponse.retrieved_context.map((context, idx) => (
                  <ContextCard key={idx} context={context} index={idx} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!queryResponse && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Policy Documents
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask questions about your policy documents and see exactly which sections
              informed the answer with full structural context.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Analyzing policy documents...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
