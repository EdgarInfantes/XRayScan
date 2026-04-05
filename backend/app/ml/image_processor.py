from pathlib import Path
from typing import Union

import cv2
import numpy as np
import requests


class ImageLoader:
    @staticmethod
    def load_bgr(image_source: Union[str, Path]) -> np.ndarray:
        image_source = str(image_source)

        if image_source.startswith("http://") or image_source.startswith("https://"):
            response = requests.get(image_source, timeout=15)
            response.raise_for_status()
            img_array = np.frombuffer(response.content, dtype=np.uint8)
            image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        else:
            image = cv2.imread(image_source)

        if image is None:
            raise FileNotFoundError(f"No se pudo leer la imagen: {image_source}")

        return image


class ImageAnnotator:
    @staticmethod
    def draw_box(
        image: np.ndarray,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
        color=(0, 0, 255),
        thickness: int = 2,
    ) -> None:
        cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)

    @staticmethod
    def draw_label(
        image: np.ndarray,
        x1: int,
        y1: int,
        label: str,
        text_color=(0, 0, 255),
        background_color=(255, 255, 255),
        thickness: int = 2,
    ) -> None:
        (text_width, text_height), _ = cv2.getTextSize(
            label,
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            2,
        )

        y_top = max(0, y1 - text_height - 10)
        y_bottom = max(0, y1)

        cv2.rectangle(
            image,
            (x1, y_top),
            (x1 + text_width + 6, y_bottom),
            background_color,
            -1,
        )

        cv2.putText(
            image,
            label,
            (x1 + 3, max(15, y1 - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            text_color,
            thickness,
            cv2.LINE_AA,
        )