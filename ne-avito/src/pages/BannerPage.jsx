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
        <HorizontalPhotoGallery className="big" photos={banner.images} />
        <div>
          <p> {banner.name} </p>
          <p> {banner.description} </p>
        </div>
      </div>
    );
}