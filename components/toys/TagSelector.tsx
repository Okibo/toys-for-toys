import React, { useMemo } from 'react';

interface TagSelectorProps {
  category: string;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  error?: string[];
  className?: string;
}

const CATEGORY_TAGS: Record<string, string[]> = {
  'Blocks': ['LEGO', 'Duplo', 'Building', 'Construction'],
  'Vehicles': ['Car', 'Truck', 'Train', 'Airplane', 'Model'],
  'Dolls': ['Action Figure', 'Fashion Doll', 'Baby Doll', 'Plush'],
  'Board Games': ['Strategy', 'Family-Friendly', 'Cooperative', 'Card Game'],
  'Educational': ['STEM', 'Puzzle', 'Learning', 'Interactive'],
  'Sports': ['Ball', 'Outdoor', 'Action Sports', 'Racket'],
  'Art': ['Craft', 'Coloring', 'Building', 'DIY'],
  'Other': []
};

/**
 * Tag selector component with category-specific tags
 * Allows selecting 1-3 tags with visual feedback
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  category,
  selectedTags,
  onChange,
  disabled = false,
  error,
  className = ''
}) => {
  const availableTags = useMemo(() => {
    return CATEGORY_TAGS[category] || [];
  }, [category]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isMaxTags = selectedTags.length >= 3;
  const selectCount = `${selectedTags.length} of 3`;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Tags
          <span className="text-gray-500 ml-1 text-xs">(optional, max 3)</span>
        </label>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Clear all tags"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tag count indicator */}
      <p className="text-xs text-gray-500 mb-3">
        {selectCount} selected
      </p>

      {/* Available tags grid */}
      {availableTags.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 mb-3"
          role="group"
          aria-label="Tag options"
        >
          {availableTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              disabled={disabled || (isMaxTags && !selectedTags.includes(tag))}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium text-center
                transition-colors border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${
                  selectedTags.includes(tag)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
                ${
                  disabled || (isMaxTags && !selectedTags.includes(tag))
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:cursor-pointer'
                }
              `}
              aria-pressed={selectedTags.includes(tag)}
              aria-label={`${tag}${selectedTags.includes(tag) ? ', selected' : ''}`}
            >
              {selectedTags.includes(tag) && (
                <span className="mr-1" aria-hidden="true">✓</span>
              )}
              {tag}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-3 italic">
          No predefined tags for this category. You can still add custom tags below.
        </p>
      )}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map(tag => (
            <div
              key={tag}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                disabled={disabled}
                className="ml-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                aria-label={`Remove ${tag} tag`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && error.length > 0 && (
        <div
          id="tags-error"
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error.map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
