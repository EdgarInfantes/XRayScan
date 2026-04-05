from pathlib import Path
from typing import Any, Tuple

import joblib
import torch
import timm
from timm.data import create_transform, resolve_data_config
from ultralytics import YOLO


class ModelLoader:
    def __init__(
        self,
        yolo_model_path: Path,
        ml_model_path: Path,
        feature_extractor_path: Path,
        backbone_name: str,
        num_classes: int,
        device: str,
    ) -> None:
        self.yolo_model_path = yolo_model_path
        self.ml_model_path = ml_model_path
        self.feature_extractor_path = feature_extractor_path
        self.backbone_name = backbone_name
        self.num_classes = num_classes
        self.device = device

    def load(self) -> Tuple[Any, Any, torch.nn.Module, Any]:
        yolo_detector = YOLO(str(self.yolo_model_path))
        ml_model = joblib.load(self.ml_model_path)

        feature_extractor = timm.create_model(
            self.backbone_name,
            pretrained=False,
            num_classes=self.num_classes,
        )

        checkpoint = torch.load(self.feature_extractor_path, map_location=self.device)
        state_dict = (
            checkpoint["model_state"]
            if isinstance(checkpoint, dict) and "model_state" in checkpoint
            else checkpoint
        )

        feature_extractor.load_state_dict(state_dict, strict=True)
        feature_extractor.to(self.device)
        feature_extractor.eval()

        config = resolve_data_config({}, model=feature_extractor)
        transform = create_transform(**config, is_training=False)

        return yolo_detector, ml_model, feature_extractor, transform