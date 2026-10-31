import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_API } from "../constants";
import "./styles/CategorySidebar.css";

export default function CategorySidebar({ rootCategoryId, currentCategoryId }) {
  const [path, setPath] = useState([]);
  const [childrenCache, setChildrenCache] = useState({});
  const [loading, setLoading] = useState(new Set());

  const rootCategory = path[0] ?? null;
  const currentCategory = path[path.length - 1] ?? null;

  useEffect(() => {
    if (!rootCategoryId) {
      setPath([]);
      setChildrenCache({});
      setLoading(new Set());
      return;
    }

    let cancelled = false;

    setPath([]);
    setChildrenCache({});
    setLoading(new Set());

    const fetchCategory = async (id) => {
      const response = await fetch(`${CATEGORY_API}/${id}`);

      if (!response.ok) {
        throw new Error(`Не удалось загрузить категорию ${id}`);
      }

      return response.json();
    };

    const fetchChildren = async (id) => {
      const response = await fetch(`${CATEGORY_API}/directChildren/${id}`);

      if (!response.ok) {
        throw new Error(`Не удалось загрузить детей категории ${id}`);
      }

      return response.json();
    };

    const loadCategoryPath = async () => {
      try {
        const root = await fetchCategory(rootCategoryId);

        if (cancelled) return;

        let restoredPath = [root];

        if (
          currentCategoryId &&
          String(currentCategoryId) !== String(root.id)
        ) {
          const reversedPath = [];
          const visited = new Set();

          let category = await fetchCategory(currentCategoryId);

          while (String(category.id) !== String(root.id)) {
            if (visited.has(String(category.id))) {
              throw new Error("Обнаружен цикл в категориях");
            }

            visited.add(String(category.id));
            reversedPath.push(category);

            if (!category.parentId) {
              throw new Error("Категория не принадлежит этому корню");
            }

            category = await fetchCategory(category.parentId);
          }

          restoredPath = [root, ...reversedPath.reverse()];
        }

        if (cancelled) return;

        const childrenEntries = await Promise.all(
          restoredPath.map(async (category) => {
            const children = await fetchChildren(category.id);

            return [category.id, children];
          }),
        );

        if (cancelled) return;

        setPath(restoredPath);
        setChildrenCache(Object.fromEntries(childrenEntries));
      } catch (err) {
        if (!cancelled) {
          console.error("Ошибка восстановления пути категорий:", err);
        }
      }
    };

    loadCategoryPath();

    return () => {
      cancelled = true;
    };
  }, [rootCategoryId, currentCategoryId]);

  const loadChildren = async (categoryId) => {
    if (childrenCache[categoryId] !== undefined) {
      return childrenCache[categoryId];
    }

    setLoading((prev) => new Set(prev).add(categoryId));

    try {
      const response = await fetch(
        `${CATEGORY_API}/directChildren/${categoryId}`
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить дочерние категории");
      }

      const children = await response.json();

      setChildrenCache((prev) => ({
        ...prev,
        [categoryId]: children,
      }));

      return children;
    }
    catch (err) {
      console.error(
        `Ошибка загрузки детей категории ${categoryId}:`,
        err
      );

      return [];
    }
    finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    }
  };

  const handleCategoryClick = (category) => {
    if (category.id === rootCategoryId) {
      setPath([rootCategory]);
      return;
    }

    setPath((prev) =>

{
      const existingIndex = prev.findIndex(
        (item) => item.id === category.id
      );

      if (existingIndex !== -1) {
        return prev.slice(0, existingIndex + 1);
      }

      return [...prev, category];
    });

    loadChildren(category.id);
  };

  const handleParentClick = (index) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  const renderCategory = (
    category,
    level,
    isAncestor = false,
    pathIndex = -1
  ) => {
    const isLoading = loading.has(category.id);

    const isActive = currentCategoryId != null && currentCategoryId === category.id;

    return (
      <div key={category.id} className="category-node">
        <div
          className={`category-item level-${level}
            ${isActive ? "active" : ""}
            ${isAncestor ? "ancestor-category" : ""}`}
          style={{ paddingLeft: `${level * 16 + 10}px` }}
        >
          <span className="category-icon">
            {isLoading ? "⏳" : isAncestor ? "❮" : ""}
          </span>

          {isActive ? (
            <div className="category-name">
              {category.name}
            </div>
          ) : (
            <Link
              to={`?categoryId=${category.id}`}
              className="category-name"
              onClick={() => {
                if (isAncestor) {
                  handleParentClick(pathIndex);
                } else {
                  handleCategoryClick(category);
                }
              }}
            >
              {category.name}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (!rootCategory || !currentCategory) {
    return null;
  }

  const currentChildren = childrenCache[currentCategory.id] ?? [];

  const ancestors = path.slice(0, -1);

  return (
    <aside className="category-sidebar">
      <h3 className="sidebar-title">Категория</h3>

      <div className="category-tree">
        {/* 1. Корень и все промежуточные родители */}
        {ancestors.map((category, index) =>
          renderCategory(
            category,
            index,
            true,
            index
          )
        )}

        {/* 2. Текущая выбранная категория */}
        {renderCategory(
          currentCategory,
          path.length - 1,
          false
        )}

        {/* 3. Только прямые дети текущей категории */}
        {currentChildren.map((child) =>
          renderCategory(
            child,
            path.length
          )
        )}
      </div>
    </aside>
  );
}
