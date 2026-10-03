import { useRef, useState } from "react";
import "./styles/AddBannerPage.css";

const API_URL = "http://localhost:8000";

export default function AddBannerPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategory] = useState("");
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRef = useRef(null);

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setImages((prev) => [...prev, ...newFiles]);

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  async function createBanner(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Введите название объявления");
      return;
    }

    if (images.length == 0) {
      setError("Прикрепите изображение");
      return;
    }

    try {
      setLoading(true);

      // 1. Создаём Banner в MongoDB
      const bannerResponse = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          categoryId,
        }),
      });

      if (!bannerResponse.ok) {
        throw new Error("Не удалось создать объявление");
      }

      const banner = await bannerResponse.json();

      // 2. Получаем presigned URL для MinIO
      for (const image of images) {
        const uploadUrlResponse = await fetch(
          `${API_URL}/${banner.id}/images/upload-url`,
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
          `${API_URL}/${banner.id}/images/${uploadData.imageId}/complete`,
          {
            method: "POST",
          },
        );

        if (!completeResponse.ok) {
          throw new Error("Не удалось подтвердить загрузку");
        }
      }

      setSuccess(`Объявление создано! ID: ${banner.id}`);

      setName("");
      setDescription("");
      setImages([]);

      // Сбрасываем input type=file
      event.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <h1>Создание объявления</h1>

      <form onSubmit={createBanner}>
        <label>
          Название
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Введите название"
            disabled={loading}
          />
        </label>

        <label>
          <input
            type="text"
            value={categoryId}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Введите категорию"
            disabled={loading}
          />
        </label>

        <label>
          Описание
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Введите описание"
            rows={5}
            disabled={loading}
          />
        </label>

        <label>
          Изображение
          <div>
            <div className="photos">
              {images.map((image, index) => (
                <div className="photo" key={`${image.name}-${index}`}>
                  <img src={URL.createObjectURL(image)} alt={image.name} />

                  <button onClick={() => removeImage(index)}>×</button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => inputRef.current.click()}
                className="add"
              >
                + Добавить фото
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Создание..." : "Разместить"}
        </button>

        {error && <p className="error">{error}</p>}

        {success && <p className="success">{success}</p>}
      </form>
    </div>
  );
}
