import { useState } from "react";

export default function CategoryItem({ category, categories }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const children = categories.filter(
    (item) => item.parentId === category.id
  );

  return (
    <div className="category-item">
      <div
        className="category-name"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {category.name}

        {children.length > 0 && (
          <span>{isExpanded ? " ▼" : " ▶"}</span>
        )}
      </div>

      {isExpanded && (
        <div className="category-children">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}