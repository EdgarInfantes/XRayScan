from pathlib import Path
from typing import List

import joblib
import numpy as np


class ClassNameResolver:
    DEFAULT_CLASS_NAMES = [
        "Baton",
        "Pliers",
        "Hammer",
        "Powerbank",
        "Scissors",
        "Wrench",
        "Gun",
        "Bulleta", # Wrench
        "Sprayer",
        "HandCuffs",
        "Knife",
        "Lighter",
    ]

    def __init__(self, class_names_path: Path) -> None:
        self.class_names_path = class_names_path

    def get_class_names(self) -> List[str]:
        if not self.class_names_path.exists():
            return self.DEFAULT_CLASS_NAMES

        loaded = joblib.load(self.class_names_path)

        if isinstance(loaded, list):
            return loaded

        if isinstance(loaded, tuple):
            return list(loaded)

        if isinstance(loaded, np.ndarray):
            return loaded.tolist()

        if isinstance(loaded, dict):
            try:
                return [loaded[i] for i in sorted(loaded.keys())]
            except Exception:
                return list(loaded.values())

        return self.DEFAULT_CLASS_NAMES