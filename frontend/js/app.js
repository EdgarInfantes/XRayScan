const BACKEND_URL = "http://127.0.0.1:8000";

const dangerObjects = new Set(["Gun", "Knife", "Bullet", "Baton"]);
const warningObjects = new Set(["Powerbank", "Lighter", "Sprayer", "Scissors"]);

let activeTab = "upload";
let selectedFile = null;

const fileInput = document.getElementById("fileInput");
const fileInputImage = document.getElementById("fileInputImage");
const fileLabel = document.getElementById("fileLabel");
const imageLabel = document.getElementById("imageLabel");
const processBtn = document.getElementById("processBtn");
const processBtnText = document.getElementById("processBtnText");
const resetBtn = document.getElementById("resetBtn");
const errorText = document.getElementById("errorText");
const emptyState = document.getElementById("emptyState");
const processingOverlay = document.getElementById("processingOverlay");
const currentStep = document.getElementById("currentStep");
const progressBar = document.getElementById("progressBar");
const scanLine = document.getElementById("scanLine");
const imageResultWrapper = document.getElementById("imageResultWrapper");
const resultImage = document.getElementById("resultImage");
const detectionsTableBody = document.getElementById("detectionsTableBody");
const verdictContainer = document.getElementById("verdictContainer");
const serverStatus = document.getElementById("serverStatus");
const detectionCount = document.getElementById("detectionCount");
const inputType = document.getElementById("inputType");

const uploadPanel = document.getElementById("uploadPanel");
const youtubePanel = document.getElementById("youtubePanel");
const imagePanel = document.getElementById("imagePanel");

function translateObjectName(name) {
  const mapping = {
    Baton: "Bastón",
    Pliers: "Alicate",
    Hammer: "Martillo",
    Powerbank: "Powerbank",
    Scissors: "Tijeras",
    Wrench: "Llave",
    Gun: "Arma de Fuego",
    Bullet: "Bala",
    Sprayer: "Spray",
    HandCuffs: "Esposas",
    Knife: "Cuchillo",
    Lighter: "Encendedor"
  };
  return mapping[name] || name;
}

function getStatus(className) {
  if (dangerObjects.has(className)) return "Peligro";
  if (warningObjects.has(className)) return "Advertencia";
  return "Revisar";
}

function getStatusBadge(status) {
  if (status === "Peligro") {
    return {
      bg: "rgba(218, 23, 16, 0.08)",
      color: "#DA1710",
      border: "rgba(218, 23, 16, 0.20)"
    };
  }

  if (status === "Advertencia") {
    return {
      bg: "#FFFBEB",
      color: "#92400E",
      border: "rgba(245, 158, 11, 0.25)"
    };
  }

  return {
    bg: "rgba(0, 68, 129, 0.08)",
    color: "#004481",
    border: "rgba(0, 68, 129, 0.20)"
  };
}

function setTab(tab) {
  activeTab = tab;
  inputType.textContent = tab.toUpperCase();

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.style.backgroundColor = isActive ? "var(--primary)" : "white";
    btn.classList.toggle("text-white", isActive);
    btn.classList.toggle("text-slate-400", !isActive);
  });

  uploadPanel.classList.toggle("hidden", tab !== "upload");
  youtubePanel.classList.toggle("hidden", tab !== "youtube");
  imagePanel.classList.toggle("hidden", tab !== "image");

  clearError();
}

function clearError() {
  errorText.textContent = "";
  errorText.classList.add("hidden");
}

function showError(message) {
  errorText.textContent = message;
  errorText.classList.remove("hidden");
}

function resetUI() {
  selectedFile = null;
  fileInput.value = "";
  fileInputImage.value = "";
  fileLabel.textContent = "Cargar Imagen de Rayos X";
  imageLabel.textContent = "Arrastre o seleccione una imagen individual";
  resultImage.src = "";
  imageResultWrapper.classList.add("hidden");
  emptyState.classList.remove("hidden");
  detectionsTableBody.innerHTML = `
    <tr>
      <td colspan="4" class="px-5 py-10 text-center text-xs text-slate-400 italic">
        No se han generado registros en la sesión actual
      </td>
    </tr>
  `;
  verdictContainer.innerHTML = `
    <div class="space-y-4">
      <i data-lucide="shield" class="w-12 h-12 text-slate-100 mx-auto"></i>
      <p class="text-xs text-slate-400">Esperando finalización de analítica</p>
    </div>
  `;
  detectionCount.textContent = "0";
  resetBtn.classList.add("hidden");
  clearError();
  lucide.createIcons();
}

function setProcessingState(isProcessing, message = "PROCESANDO ANALÍTICA...") {
  processBtn.disabled = isProcessing;
  processBtnText.textContent = isProcessing ? message : "INICIAR PROCESAMIENTO";
  processingOverlay.classList.toggle("hidden", !isProcessing);
  processingOverlay.classList.toggle("flex", isProcessing);
  scanLine.classList.toggle("hidden", !isProcessing);
  serverStatus.textContent = isProcessing ? "Processing" : "Ready";

  if (isProcessing) {
    emptyState.classList.add("hidden");
  }
}

function renderDetections(detections) {
  if (!detections || detections.length === 0) {
    detectionsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-5 py-10 text-center text-xs text-slate-400 italic">
          No se encontraron objetos en la imagen procesada
        </td>
      </tr>
    `;
    detectionCount.textContent = "0";
    return;
  }

  detectionsTableBody.innerHTML = detections.map((detection, index) => {
    const status = getStatus(detection.class_name);
    const badge = getStatusBadge(status);

    return `
      <tr class="hover:bg-slate-50 transition-colors text-xs text-slate-700">
        <td class="px-5 py-3 font-mono">#${index + 1}</td>
        <td class="px-5 py-3 font-bold">${translateObjectName(detection.class_name)}</td>
        <td class="px-5 py-3 text-slate-500">${(detection.confidence * 100).toFixed(1)}%</td>
        <td class="px-5 py-3">
          <span
            class="px-2 py-0.5 rounded-[2px] text-[9px] font-bold"
            style="background-color: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border};"
          >
            ${status.toUpperCase()}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  detectionCount.textContent = String(detections.length);
}

function renderVerdict(detections) {
  if (!detections || detections.length === 0) {
    verdictContainer.innerHTML = `
      <div class="space-y-6 w-full">
        <div class="p-5 rounded-lg border-l-4" style="background-color: rgba(45, 204, 112, 0.05); border-color: #2DCC70;">
          <div class="flex items-center justify-center gap-2 mb-2">
            <i data-lucide="check-circle" class="w-5 h-5" style="color: #2DCC70;"></i>
            <h4 class="text-sm font-bold" style="color: #2DCC70;">SIN HALLAZGOS CRÍTICOS</h4>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            No se detectaron objetos clasificados como amenaza en la imagen analizada.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 p-3 rounded border" style="border-color: var(--slate200);">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Detecciones</p>
            <p class="text-lg font-bold text-slate-700">00</p>
          </div>
          <div class="bg-slate-50 p-3 rounded border" style="border-color: var(--slate200);">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Riesgo</p>
            <p class="text-lg font-bold text-slate-700">Bajo</p>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const dangerCount = detections.filter((d) => getStatus(d.class_name) === "Peligro").length;
  const warningCount = detections.filter((d) => getStatus(d.class_name) === "Advertencia").length;
  const avgConfidence = detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length;

  let title = "RIESGO BAJO";
  let description = "Se detectaron elementos no críticos. Se recomienda revisión manual.";
  let color = "var(--primary)";
  let icon = "info";

  if (dangerCount > 0) {
    title = "RIESGO CRÍTICO";
    description = "Se han detectado objetos prohibidos. Se recomienda inspección física inmediata.";
    color = "var(--danger)";
    icon = "alert-triangle";
  } else if (warningCount > 0) {
    title = "RIESGO MEDIO";
    description = "Se detectaron objetos que requieren validación adicional por el operador.";
    color = "var(--warningBorder)";
    icon = "alert-triangle";
  }

  verdictContainer.innerHTML = `
    <div class="space-y-6 w-full">
      <div class="p-5 rounded-lg border-l-4" style="background-color: rgba(218, 23, 16, 0.05); border-color: ${color};">
        <div class="flex items-center justify-center gap-2 mb-2">
          <i data-lucide="${icon}" class="w-5 h-5" style="color: ${color};"></i>
          <h4 class="text-sm font-bold" style="color: ${color};">${title}</h4>
        </div>
        <p class="text-[11px] text-slate-500 leading-relaxed">
          ${description}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-50 p-3 rounded border" style="border-color: var(--slate200);">
          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Detecciones</p>
          <p class="text-lg font-bold text-slate-700">${String(detections.length).padStart(2, "0")}</p>
        </div>
        <div class="bg-slate-50 p-3 rounded border" style="border-color: var(--slate200);">
          <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Confianza</p>
          <p class="text-lg font-bold text-slate-700">${Math.round(avgConfidence * 100)}%</p>
        </div>
      </div>

      <button class="w-full py-3 rounded text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        style="background-color: var(--primary);">
        <i data-lucide="file-text" class="w-4 h-4"></i>
        GENERAR REPORTE COMPLETO
      </button>
    </div>
  `;

  lucide.createIcons();
}

async function processImage() {
  if (!selectedFile) {
    showError("Selecciona una imagen para procesar.");
    return;
  }

  clearError();
  resetBtn.classList.remove("hidden");

  const steps = [
    { msg: "Inicializando entorno de seguridad...", p: 15 },
    { msg: "Cargando detector y pipeline híbrido...", p: 35 },
    { msg: "Detectando regiones de interés...", p: 55 },
    { msg: "Clasificando objetos detectados...", p: 80 },
    { msg: "Generando salida visual...", p: 95 }
  ];

  let stepIndex = 0;
  currentStep.textContent = steps[0].msg;
  progressBar.style.width = `${steps[0].p}%`;
  setProcessingState(true);

  const interval = setInterval(() => {
    stepIndex += 1;
    if (stepIndex < steps.length) {
      currentStep.textContent = steps[stepIndex].msg;
      progressBar.style.width = `${steps[stepIndex].p}%`;
    }
  }, 600);

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    clearInterval(interval);
    progressBar.style.width = "100%";
    currentStep.textContent = "ANÁLISIS COMPLETADO";

    if (!response.ok) {
      throw new Error(data.error || "Falló la petición al backend.");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    setTimeout(() => {
      setProcessingState(false);
      resultImage.src = `data:image/jpeg;base64,${data.image}`;
      imageResultWrapper.classList.remove("hidden");
      emptyState.classList.add("hidden");
      renderDetections(data.detections || []);
      renderVerdict(data.detections || []);
    }, 350);
  } catch (error) {
    clearInterval(interval);
    setProcessingState(false);
    progressBar.style.width = "0%";
    currentStep.textContent = "ERROR";
    showError(error.message || "Error de conexión con el backend.");
    serverStatus.textContent = "Error";
    emptyState.classList.remove("hidden");
    imageResultWrapper.classList.add("hidden");
  }
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile = file;
  fileLabel.textContent = file.name;
  clearError();
});

fileInputImage.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile = file;
  imageLabel.textContent = file.name;
  clearError();
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

processBtn.addEventListener("click", () => {
  if (activeTab === "youtube") {
    showError("El modo YouTube todavía no está conectado al backend.");
    return;
  }
  processImage();
});

resetBtn.addEventListener("click", resetUI);

resetUI();
setTab("upload");
lucide.createIcons();