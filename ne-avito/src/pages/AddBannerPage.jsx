import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/AddBannerPage.css";

const BANNER_API_URL = "http://localhost:8000";
const CATEGORY_API_URL = "http://localhost:8001";

export default function AddBannerPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setImages((prev) => [...prev, ...newFiles]);

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetch(CATEGORY_API_URL)
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      });
  }, []);

  async function createBanner(event) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Введите название объявления");
      return;
    }

    if (images.length == 0) {
      setError("Прикрепите изображение");
      return;
    }

    if (!selectedCategory) {
      setError("Выберите категорию");
    }

    try {
      setLoading(true);

      // 1. Создаём Banner в MongoDB
      const bannerResponse = await fetch(`${BANNER_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          categoryId: selectedCategory,
        }),
      });

      if (!bannerResponse.ok) {
        throw new Error("Не удалось создать объявление");
      }

      const banner = await bannerResponse.json();

      // 2. Получаем presigned URL для MinIO
      for (const image of images) {
        const uploadUrlResponse = await fetch(
          `${BANNER_API_URL}/${banner.id}/images/upload-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contentType: image.type,
            }),
          },
        );

        if (!uploadUrlResponse.ok) {
          throw new Error("Не удалось получить URL загрузки");
        }

        const uploadData = await uploadUrlResponse.json();

        // 3. Загружаем изображение напрямую в MinIO
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": image.type,
          },
          body: image,
        });

        if (!uploadResponse.ok) {
          throw new Error("Не удалось загрузить изображение");
        }

        // 4. Подтверждаем загрузку
        const completeResponse = await fetch(
          `${BANNER_API_URL}/${banner.id}/images/${uploadData.imageId}/complete`,
          {
            method: "POST",
          },
        );

        if (!completeResponse.ok) {
          throw new Error("Не удалось подтвердить загрузку");
        }
      }

      navigate(`/banner/${banner.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <h2>Создание объявления</h2>

      <form onSubmit={createBanner}>
        <div className="categories-block">
          {categories.map((category, _) => (
            <button
              className={`category ${selectedCategory === category.id ? "selected" : ""}`}
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="form-block">
          <label htmlFor="name">Название</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Введите название"
            disabled={loading}
          />
        </div>

        <div className="form-block">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Введите описание"
            rows={5}
            disabled={loading}
          />
        </div>

        <div className="form-block">
          <label htmlFor="images">Изображения</label>
          <div>
            <div className="photos">
              {images.map((image, index) => (
                <div className="photo" key={`${image.name}-${index}`}>
                  <img src={URL.createObjectURL(image)} alt={image.name} />

                  <button className="delete" onClick={() => removeImage(index)}>
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => inputRef.current.click()}
                className="add"
              >
                +
              </button>
            </div>

            <input
              id="images"
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
        <button className="addBanner" type="submit" disabled={loading}>
          {loading ? "Создание..." : "Разместить"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
