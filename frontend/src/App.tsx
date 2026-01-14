import { useState, useEffect } from 'react';
import { QueryBar } from './components/QueryBar';
import { AnswerDisplay } from './components/AnswerDisplay';
import { ContextCard } from './components/ContextCard';
import { policyApi } from './services/api';
import { QueryResponse, Stats } from './types';

function App() {
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await policyApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
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
            {stats && (
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Powered by{' '}
              <span className="font-medium">Weaviate</span>,{' '}
              <span className="font-medium">Cohere</span>, and{' '}
              <span className="font-medium">Groq</span>
            </div>
            <div>
              Structural Chunking • Hybrid Search • Generative AI
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
