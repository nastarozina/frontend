import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import HorizontalPhotoGallery from "../components/HorizontalPhotoGallery";
import "./styles/BannerPage.css";


export default function BannerPage() {
    const { bannerId } = useParams();
    const [banner, setBanner] = useState(null);

    useEffect(() => {
      fetch(`http://localhost:8000/${bannerId}`)
        .then((response) => response.json())
        .then((data) => {
          setBanner(data);
        });
    }, [bannerId]);
    
    if (!banner) {
        return <div>Loading...</div>;
    }
       
    return (
      <div className="banner-block">
        <HorizontalPhotoGallery imageSize={500} photos={banner.images} />
        <div className="text-block">
          <h2> {banner.name} </h2>
          <h3> Описание </h3>
          <p> {banner.description} </p>
        </div>
      </div>
    );
}