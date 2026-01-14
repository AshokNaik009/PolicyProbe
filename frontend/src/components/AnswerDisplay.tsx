interface AnswerDisplayProps {
  answer: string;
  contextCount: number;
}

export const AnswerDisplay = ({ answer, contextCount }: AnswerDisplayProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Generated Answer</h2>
        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {contextCount} sources
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Generated from {contextCount} structural segments using Groq LLM
        </p>
      </div>
    </div>
  );
};
