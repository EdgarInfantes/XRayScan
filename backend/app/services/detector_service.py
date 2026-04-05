from pathlib import Path
from typing import Any, Dict
import base64
import uuid

import cv2

from app.core.config import settings
from app.ml.pipeline import HybridXRayDetector


class DetectorService:
    def __init__(self) -> None:
        settings.validate_paths()

        self.detector = HybridXRayDetector(
            yolo_model_path=settings.yolo_model_path,
            ml_model_path=settings.ml_model_path,
            feature_extractor_path=settings.feature_extractor_path,
            class_names_path=settings.class_names_path,
            backbone_name=settings.backbone_name,
        )

    def predict_from_image_path(self, image_path: Path) -> Dict[str, Any]:
        result = self.detector.detect(
            image_source=image_path,
            conf_det=settings.default_detection_confidence,
            min_box_area=settings.default_min_box_area,
        )

        success, encoded_image = cv2.imencode(".jpg", result["image_bgr"])
        if not success:
            raise ValueError("No se pudo codificar la imagen de salida")

        image_base64 = base64.b64encode(encoded_image).decode("utf-8")

        return {
            "image": image_base64,
            "detections": result["detections"],
        }

    def build_temp_file_path(self, original_filename: str) -> Path:
        suffix = Path(original_filename).suffix or ".jpg"
        file_id = str(uuid.uuid4())
        return settings.temp_dir / f"{file_id}{suffix}"


detector_service = DetectorService()