import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 my-4 overflow-x-auto pb-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 whitespace-nowrap ${
          activeCategory === null
            ? 'bg-[#ee6650] text-white'
            : 'bg-[#69adaf]/20 text-[#69adaf] hover:bg-[#69adaf]/40'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 whitespace-nowrap ${
            activeCategory === category
              ? 'bg-[#ee6650] text-white'
              : 'bg-[#69adaf]/20 text-[#69adaf] hover:bg-[#69adaf]/40'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
