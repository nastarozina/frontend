import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./styles/BannersPage.css";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import CategorySidebar from "../components/CategorySidebar";
import { BANNER_API, CATEGORY_API } from "../constants";

export default function BannersPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const [rootCategories, setRootCategories] = useState([]);

  const [categoryName, setCategoryName] = useState("");
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");
  const [rootCategoryId, setRootCategoryId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.append("categoryId", categoryId);

    const queryString = params.toString();
    const url = queryString ? `${BANNER_API}?${queryString}` : BANNER_API;

    setCategoryName("");

    fetch(CATEGORY_API)
      .then((res) => res.json())
      .then((data) => {
        const roots = data.filter(
          (cat) => !cat.parentId || cat.parentId === "null",
        );
        setRootCategories(roots);
      })
      .catch((err) => console.error("Ошибка загрузки категорий:", err));

    if (categoryId) {
      fetch(`${CATEGORY_API}/categories/${categoryId}`)
        .then((res) => res.json())
        .then((chain) => {
          if (chain && chain.length > 0) {
            setRootCategoryId(chain[0].id);
          }
        })
        .catch((err) => console.error("Ошибка получения цепочки:", err));
    } else {
      setRootCategoryId(null);
    }

    if (categoryId) {
      fetch(`${CATEGORY_API}/names?${queryString}`)
        .then((response) => {
          if (!response.ok)
            throw new Error("Ошибка при получении названия категории");
          return response.json();
        })
        .then((data) => {
          if (data[categoryId]) {
            setCategoryName(data[categoryId].name);
          }
        })
        .catch((err) => {
          console.error(err);
          setCategoryName("");
        });
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          const errorText = response.text();

          let errorMessage;

          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = JSON.stringify(errorJson, null, 2);
          } catch {
            errorMessage = errorText;
          }

          console.error("Banner API error:", errorMessage);

          throw new Error(`Ошибка ${response.status}:\n${errorMessage}`);
        }
        return response.json();
      })
      .then((data) => {
        setBanners(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setBanners([]);
      });
  }, [categoryId]);

  return (
    <div className="banners-page-layout">
      <nav className="root-categories-nav">
        <div className="root-categories-container">
          {rootCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`?categoryId=${cat.id}`}
              className={`root-category-item ${rootCategoryId === cat.id ? "active" : ""}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="banners-page-content">
        {rootCategoryId && (
          <CategorySidebar
            rootCategoryId={rootCategoryId}
            currentCategoryId={categoryId}
          />
        )}

        <div className="banners-main-content">
          {categoryId && categoryName && (
            <h2 className="category-title">{categoryName}</h2>
          )}

          {error && <p className="error">{error}</p>}

          <div className="banners-grid">
            {banners.length > 0
              ? banners.map((banner) => (
                  <div className="banner" key={banner.id}>
                    <HorizontalPhotoGallery
                      imageSize={230}
                      photos={banner.images}
                    />
                    <Link to={`/banner/${banner.id}`} className="name_banner">
                      {banner.name}
                    </Link>
                  </div>
                ))
              : !error && (
                  <p className="empty-state">
                    В этой категории пока нет объявлений.
                  </p>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
