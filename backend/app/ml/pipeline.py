from pathlib import Path
from typing import Any, Dict, List, Union

import cv2
import numpy as np
import torch
from PIL import Image

from backend.app.ml.class_mapping import ClassNameResolver
from backend.app.ml.image_processor import ImageAnnotator, ImageLoader
from backend.app.ml.model_loader import ModelLoader


class HybridXRayDetector:
    def __init__(
        self,
        yolo_model_path: Path,
        ml_model_path: Path,
        feature_extractor_path: Path,
        class_names_path: Path,
        backbone_name: str,
    ) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.class_names = ClassNameResolver(class_names_path).get_class_names()
        self.num_classes = len(self.class_names)
        self.idx_to_name = {
            0: "Baton",
            1: "Pliers",
            2: "Knife",
            3: "Lighter",
            4: "Hammer",
            5: "Powerbank",
            6: "Scissors",
            7: "Wrench",
            8: "Gun",
            9: "Bullet",
            10: "Sprayer",
            11: "HandCuffs",
        }

        loader = ModelLoader(
            yolo_model_path=yolo_model_path,
            ml_model_path=ml_model_path,
            feature_extractor_path=feature_extractor_path,
            backbone_name=backbone_name,
            num_classes=self.num_classes,
            device=self.device,
        )

        self.yolo_detector, self.ml_model, self.feature_extractor, self.transform = loader.load()

    @torch.no_grad()
    def classify_crop_bgr(self, crop_bgr: np.ndarray) -> Dict[str, Any]:
        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(crop_rgb)

        tensor = self.transform(pil_image).unsqueeze(0).to(self.device)

        features = self.feature_extractor.forward_features(tensor)
        embedding = (
            self.feature_extractor.forward_head(features, pre_logits=True)
            .detach()
            .cpu()
            .numpy()
        )

        probabilities = self.ml_model.predict_proba(embedding)[0]
        pred_id = int(np.argmax(probabilities))
        confidence = float(probabilities[pred_id])
        pred_name = self.idx_to_name.get(pred_id, f"class_{pred_id}")

        return {
            "pred_id": pred_id,
            "pred_name": pred_name,
            "confidence": confidence,
        }

    def detect(
        self,
        image_source: Union[str, Path],
        conf_det: float = 0.25,
        min_box_area: int = 10,
    ) -> Dict[str, Any]:
        image_bgr = ImageLoader.load_bgr(image_source)
        output_image = image_bgr.copy()

        height, width = output_image.shape[:2]
        results = self.yolo_detector.predict(
            source=output_image,
            conf=conf_det,
            verbose=False,
        )[0]

        detections: List[Dict[str, Any]] = []

        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(width, x2), min(height, y2)

            area = (x2 - x1) * (y2 - y1)
            if area < min_box_area:
                continue

            crop = output_image[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            classification = self.classify_crop_bgr(crop)
            label = f"{classification['pred_name']} {classification['confidence']:.2f}"

            ImageAnnotator.draw_box(output_image, x1, y1, x2, y2)
            ImageAnnotator.draw_label(output_image, x1, y1, label)

            detections.append(
                {
                    "bbox": [x1, y1, x2, y2],
                    "area": area,
                    "class_id": classification["pred_id"],
                    "class_name": classification["pred_name"],
                    "confidence": classification["confidence"],
                }
            )

        return {
            "image_bgr": output_image,
            "detections": detections,
        }