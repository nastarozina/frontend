import "./styles/PhotoContainer.css";
import { MINIO } from "../constants";

export default function PhotoContainer({ photo }) {
  const photoURL = `${MINIO}/banner/${photo.objectKey}`;

  return (
    <div className="photo-container">
      <img className="image" src={photoURL} alt={photo.name} />
    </div>
  );
}
