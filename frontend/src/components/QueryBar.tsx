import { useState } from 'react';

interface QueryBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const EXAMPLE_QUERIES = [
  "What is the definition of 'Excluded Damages' and where is that term mentioned in the 'Indemnification' clause?",
  "What are the user obligations under this policy?",
  "What is the termination policy?",
  "What are the limitations of liability?",
];

export const QueryBar = ({ onSearch, isLoading }: QueryBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    if (!isLoading) {
      onSearch(exampleQuery);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about the policy..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Example queries */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Example Queries
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((exampleQuery, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(exampleQuery)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exampleQuery.length > 60 ? exampleQuery.substring(0, 60) + '...' : exampleQuery}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
