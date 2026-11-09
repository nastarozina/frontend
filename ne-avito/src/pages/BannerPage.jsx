import { useParams, Link, useNavigate } from "react-router-dom"; // <-- Добавили useNavigate
import { useEffect, useState } from "react";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import "./styles/BannerPage.css";
import { BANNER_API } from "../constants";

export default function BannerPage() {
    const { bannerId } = useParams();
    const navigate = useNavigate();
    const [banner, setBanner] = useState(null);

    useEffect(() => {
      fetch(`${BANNER_API}/${bannerId}`)
        .then((response) => response.json())
        .then((data) => {
          setBanner(data);
        });
    }, [bannerId]);

    if (!banner) {
        return <div>Loading...</div>;
    }

    // Функция для перехода в чат
    const handleOpenChat = () => {
        navigate(`/chat/${banner.authorId}`);
    };

    return (
      <div className="banner-page">
        <div className="path">
          <Link to={`/`}>Главная</Link>
          {banner.categories.map((category) => (
            <div key={category.id}>
              <span> {` > `} </span>
              <Link to={`/?categoryId=${category.id}`}>{category.name}</Link>
            </div>
          ))}
        </div>
        <div className="banner-block">
          <HorizontalPhotoGallery imageSize={500} photos={banner.images} />
          <div className="text-block">
            <h2>{banner.name}</h2>

            {/* <-- Кнопка написания пользователю */}
            <button className="write-user-btn" onClick={handleOpenChat}>
                Написать пользователю
            </button>

            <h3>Описание</h3>
            <p>{banner.description}</p>
          </div>
        </div>
      </div>
    );
}