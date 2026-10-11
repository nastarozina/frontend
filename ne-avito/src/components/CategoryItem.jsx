import { useState } from "react";
import "./styles/CategoryItem.css";

export default function CategoryItem({
  category,
  categoriesByParent,
  selectedCategory,
  onSelect,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const children = categoriesByParent.get(category.id) ?? [];

  return (
    <div
      className={`category ${selectedCategory === category.id ? "selected" : ""}`}
    >
      <div
        className="category-name"
        onClick={() => {
          setIsExpanded(!isExpanded);
          onSelect(category.id);
        }}
      >
        {category.name}

        {children.length > 0 && <span>{isExpanded ? " ▼" : " ▶"}</span>}
      </div>

      {isExpanded && (
        <div className="category-children">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              categoriesByParent={categoriesByParent}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}