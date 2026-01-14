import { RetrievedContext } from '../types';

interface ContextCardProps {
  context: RetrievedContext;
  index: number;
}

export const ContextCard = ({ context, index }: ContextCardProps) => {
  const scorePercentage = (context.score * 100).toFixed(1);
  const scoreColor = context.score > 0.8 ? 'text-green-600' : context.score > 0.6 ? 'text-yellow-600' : 'text-gray-600';

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header with metadata */}
      <div className="mb-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Top Section
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {context.top_level_section}
            </div>
          </div>
          <div className={`text-right ${scoreColor}`}>
            <div className="text-xs font-medium uppercase tracking-wide">Relevance</div>
            <div className="text-lg font-bold">{scorePercentage}%</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Clause
          </div>
          <div className="text-sm font-medium text-gray-700">
            {context.section_path} {context.parent_heading}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Content */}
      <div className="text-sm text-gray-800 leading-relaxed">
        {context.content}
      </div>

      {/* Source indicator */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Source {index + 1}
        </div>
      </div>
    </div>
  );
};
