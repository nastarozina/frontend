import { useState } from "react";

const API_URL = "http://localhost:8000";

export default function Home() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function createBanner(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Введите название объявления");
      return;
    }

    if (!image) {
      setError("Выберите изображение");
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
        }),
      });

      if (!bannerResponse.ok) {
        throw new Error("Не удалось создать объявление");
      }

      const banner = await bannerResponse.json();

      // 2. Получаем presigned URL для MinIO
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

      setSuccess(`Объявление создано! ID: ${banner.id}`);

      setName("");
      setDescription("");
      setImage(null);

      // Сбрасываем input type=file
      event.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h1>Создание объявления</h1>

      <form onSubmit={createBanner} style={styles.form}>
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
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              setImage(event.target.files?.[0] || null);
            }}
            disabled={loading}
          />
        </label>

        {image && <p>Выбрано: {image.name}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Создание..." : "Создать объявление"}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        {success && <p style={styles.success}>{success}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  error: {
    color: "red",
  },

  success: {
    color: "green",
  },
};
