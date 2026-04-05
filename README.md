# Detector de Objetos Peligrosos en Rayos X

Sistema híbrido de detección y clasificación para imágenes de rayos X usando machine learning.

## Descripción

Esta aplicación web permite detectar y clasificar objetos peligrosos en imágenes de rayos X utilizando un sistema híbrido que combina:
- Detección de objetos con YOLO
- Extracción de características con EfficientNetV2
- Clasificación con Logistic Regression

## Características

- **Procesamiento de video**: Suba videos o pegue enlaces de YouTube
- **Procesamiento de imagen**: Suba imágenes individuales
- **Interfaz web moderna**: Construida con Streamlit
- **Arquitectura modular**: Código organizado y mantenible

## Instalación

1. Clona o descarga este repositorio
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Asegúrate de que los modelos estén en la carpeta `models/`:
   - `models/detector/best.pt` (YOLO)
   - `models/featureExtractor/best.pt` (EfficientNetV2)
   - `models/classifier/LogReg_tuned.joblib` (Clasificador)
   - `models/class_names.joblib` (Nombres de clases)

## Ejecución

```bash
streamlit run app.py
```

La aplicación se abrirá en tu navegador en `http://localhost:8501`

## Uso

1. Selecciona el tipo de entrada (Video, YouTube o Imagen)
2. Suba el archivo o pegue el enlace
3. Haga clic en "Procesar"
4. Visualice los resultados y descargas disponibles

## Arquitectura

- `app.py`: Interfaz principal de Streamlit
- `src/config.py`: Configuraciones y rutas
- `src/loaders.py`: Carga de modelos
- `src/image_utils.py`: Utilidades para procesamiento de imágenes
- `src/video_utils.py`: Utilidades para procesamiento de video
- `src/youtube_utils.py`: Descarga de videos de YouTube
- `src/inference.py`: Funciones principales de inferencia
- `src/pipeline.py`: Resumen de resultados

## Requisitos del Sistema

- Python 3.8+
- GPU recomendada para mejor rendimiento (CUDA)
- Espacio en disco para modelos (~500MB)

## Limitaciones

- Sistema de demostración, no para uso en producción
- Procesamiento limitado a videos cortos para demo
- Requiere modelos pre-entrenados

## Licencia

Este proyecto es para fines educativos y de demostración.