import React, { useCallback } from 'react';
import ImageUploadSection from './ImageUploadSection';
import TagSelector from './TagSelector';

interface UploadedImage {
  id: string;
  preview: string;
  order: number;
}

interface ToyListingFormProps {
  formState: {
    category: string;
    description: string;
    ageGroup: string;
    condition: string;
    tags: string[];
  };
  errors: {
    category?: string[];
    description?: string[];
    ageGroup?: string[];
    condition?: string[];
    tags?: string[];
  };
  images: UploadedImage[];
  imageErrors?: {
    maxImages?: string;
    fileSize?: string;
    invalidFormat?: string;
    general?: string;
  };
  isLoading?: boolean;
  apiError?: string | null;
  onFieldChange: (field: string, value: string | string[]) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  className?: string;
}

const CATEGORIES = ['Blocks', 'Vehicles', 'Dolls', 'Board Games', 'Educational', 'Sports', 'Art', 'Other'];
const AGE_GROUPS = ['0-2 years', '3-5 years', '6-8 years', '9-11 years', '12-14 years', '15+ years'];
const AGE_GROUP_VALUES = ['0-2', '3-5', '6-8', '9-11', '12-14', '15+'];
const CONDITIONS = [
  { value: 'Like New', label: 'Like New', description: 'No signs of wear' },
  { value: 'Good', label: 'Good', description: 'Minor signs of wear' },
  { value: 'Fair', label: 'Fair', description: 'Visible signs of use' },
  { value: 'Well-Loved', label: 'Well-Loved', description: 'Heavy use, fully functional' }
];

/**
 * Toy listing form component with all fields
 * Includes category dropdown, description textarea, age group, condition, and tag selector
 * Integrates with image upload section
 */
export const ToyListingForm: React.FC<ToyListingFormProps> = ({
  formState,
  errors,
  images,
  imageErrors = {},
  isLoading = false,
  apiError,
  onFieldChange,
  onAddImages,
  onRemoveImage,
  onReorderImages,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const descriptionLength = formState.description.length;
  const descriptionPercent = (descriptionLength / 500) * 100;
  const isNearLimit = descriptionPercent > 80;

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('category', e.target.value);
  }, [onFieldChange]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFieldChange('description', e.target.value);
  }, [onFieldChange]);

  const handleAgeGroupChange = useCallback((value: string) => {
    onFieldChange('ageGroup', value);
  }, [onFieldChange]);

  const handleConditionChange = useCallback((value: string) => {
    onFieldChange('condition', value);
  }, [onFieldChange]);

  const handleTagsChange = useCallback((tags: string[]) => {
    onFieldChange('tags', tags);
  }, [onFieldChange]);

  // Check if form is valid for submission
  const isFormValid =
    formState.category &&
    formState.description.length >= 10 &&
    formState.ageGroup &&
    formState.condition &&
    formState.tags.length > 0 &&
    images.length > 0 &&
    !isLoading;

  return (
    <form onSubmit={onSubmit} className={`max-w-2xl mx-auto ${className}`}>
      {/* API Error Alert */}
      {apiError && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-red-800 text-sm font-medium">Error: {apiError}</p>
        </div>
      )}

      {/* Category Dropdown */}
      <div className="mb-6">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formState.category}
          onChange={handleCategoryChange}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
            ${
              errors.category
                ? 'border-red-500'
                : 'border-gray-300'
            }
          `}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? 'category-error' : undefined}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <div id="category-error" className="mt-1 text-sm text-red-600">
            {errors.category.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Description Textarea */}
      <div className="mb-6">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={formState.description}
          onChange={handleDescriptionChange}
          disabled={isLoading}
          placeholder="Describe the toy's condition, features, and any special notes..."
          maxLength={500}
          rows={4}
          className={`
            w-full px-4 py-2 border rounded-lg resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
            ${
              errors.description
                ? 'border-red-500'
                : 'border-gray-300'
            }
          `}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <div className="flex items-center justify-between mt-2">
          <div>
            {errors.description && (
              <div id="description-error" className="text-sm text-red-600">
                {errors.description.map((error, idx) => (
                  <p key={idx}>{error}</p>
                ))}
              </div>
            )}
          </div>
          <div className={`text-xs font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
            {descriptionLength} / 500
          </div>
        </div>
        {isNearLimit && descriptionLength < 500 && (
          <p className="text-xs text-orange-600 mt-1">Getting close to character limit</p>
        )}
      </div>

      {/* Age Group Radio Group */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Recommended Age <span className="text-red-500">*</span>
        </label>
        <fieldset>
          <legend className="sr-only">Age group options</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AGE_GROUPS.map((label, index) => (
              <label
                key={AGE_GROUP_VALUES[index]}
                className="flex items-center p-2 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400"
                htmlFor={`age-${AGE_GROUP_VALUES[index]}`}
              >
                <input
                  id={`age-${AGE_GROUP_VALUES[index]}`}
                  type="radio"
                  name="ageGroup"
                  value={AGE_GROUP_VALUES[index]}
                  checked={formState.ageGroup === AGE_GROUP_VALUES[index]}
                  onChange={() => handleAgeGroupChange(AGE_GROUP_VALUES[index])}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  aria-label={label}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {errors.ageGroup && (
          <div className="mt-2 text-sm text-red-600">
            {errors.ageGroup.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Condition Radio Group */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Condition <span className="text-red-500">*</span>
        </label>
        <fieldset>
          <legend className="sr-only">Condition options</legend>
          <div className="space-y-2">
            {CONDITIONS.map(condition => (
              <label
                key={condition.value}
                className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50"
                htmlFor={`condition-${condition.value}`}
              >
                <input
                  id={`condition-${condition.value}`}
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={formState.condition === condition.value}
                  onChange={() => handleConditionChange(condition.value)}
                  disabled={isLoading}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  aria-label={condition.label}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{condition.label}</p>
                  <p className="text-xs text-gray-600">{condition.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
        {errors.condition && (
          <div className="mt-2 text-sm text-red-600">
            {errors.condition.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Tag Selector */}
      <TagSelector
        category={formState.category}
        selectedTags={formState.tags}
        onChange={handleTagsChange}
        disabled={isLoading}
        error={errors.tags}
      />

      {/* Image Upload Section */}
      <ImageUploadSection
        images={images}
        onAddImages={onAddImages}
        onRemoveImage={onRemoveImage}
        onReorderImages={onReorderImages}
        disabled={isLoading}
        isLoading={isLoading}
        errors={imageErrors}
      />

      {/* Form Actions */}
      <div className="mt-8 flex gap-3 sm:gap-4">
        {/* List Toy Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`
            flex-1 px-4 py-3 rounded-lg font-medium text-white
            transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed opacity-60'
            }
          `}
          aria-busy={isLoading}
          aria-disabled={!isFormValid}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Listing...
            </span>
          ) : (
            <div>
              <div>List Toy</div>
              <div className="text-xs font-normal opacity-90">-1 ticket</div>
            </div>
          )}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={`
            px-4 py-3 rounded-lg font-medium
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            border border-gray-300 bg-white text-gray-700
            hover:bg-gray-50 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Cancel
        </button>
      </div>

      {/* Form info */}
      <p className="mt-4 text-xs text-gray-600 text-center">
        Listing a toy costs <span className="font-medium">1 ticket</span> from your account.
      </p>
    </form>
  );
};

export default ToyListingForm;
