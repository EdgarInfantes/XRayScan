from pathlib import Path
import shutil
import traceback

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.services.detector_service import detector_service


app = FastAPI(title="Hybrid X-Ray Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthController:
    @staticmethod
    def root() -> dict:
        return {"message": "Backend OK"}


class PredictionController:
    @staticmethod
    async def predict(file: UploadFile = File(...)) -> JSONResponse:
        temp_path: Path = detector_service.build_temp_file_path(file.filename or "image.jpg")

        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            result = detector_service.predict_from_image_path(temp_path)

            return JSONResponse(
                status_code=200,
                content=result,
            )

        except Exception as exc:
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"error": str(exc)},
            )

        finally:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)


@app.get("/")
def root():
    return HealthController.root()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    return await PredictionController.predict(file)