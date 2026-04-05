from pathlib import Path


class Settings:
    def __init__(self) -> None:
        self.app_dir = Path(__file__).resolve().parent.parent
        self.project_root = self.app_dir.parent.parent

        self.models_dir = self.project_root / "models"
        self.temp_dir = self.app_dir / "temp"

        self.yolo_model_path = self.models_dir / "detector" / "best.pt"
        self.ml_model_path = self.models_dir / "classifier" / "LogReg_tuned.joblib"
        self.feature_extractor_path = self.models_dir / "classifier" / "effnetv2_rw_s_best.pt"
        self.class_names_path = self.models_dir / "class_names.joblib"

        self.backbone_name = "efficientnetv2_rw_s"
        self.default_detection_confidence = 0.25
        self.default_min_box_area = 10

        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def validate_paths(self) -> None:
        required_paths = [
            self.yolo_model_path,
            self.ml_model_path,
            self.feature_extractor_path,
        ]

        for path in required_paths:
            if not path.exists():
                raise FileNotFoundError(f"No existe el archivo requerido: {path}")


settings = Settings()