// Camera-based embroidery preview with overlay, drag, pinch-zoom, rotation,
// design switching and screenshot capture (no ARCore / WebXR required).

(function () {
  const statusEl = document.getElementById("ar-status");
  const videoEl = document.getElementById("camera-video");
  const overlayEl = document.getElementById("overlay-image");
  const snapshotBtn = document.getElementById("ar-snapshot");
  const designStripEl = document.getElementById("design-strip");
  const captureCanvas = document.getElementById("ar-capture-canvas");

  if (!statusEl || !videoEl || !overlayEl) return;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  const primaryDesignId = getQueryParam("id");

  let currentScale = 1;
  let currentRotation = 0; // degrees
  let currentTranslateX = 0;
  let currentTranslateY = 0;
  let activeDesignId = primaryDesignId || null;

  const activePointers = new Map();
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let pinchStartDistance = 0;
  let pinchStartAngle = 0;
  let pinchStartScale = 1;
  let pinchStartRotation = 0;

  function updateOverlayTransform() {
    overlayEl.style.transform = `translate(calc(-50% + ${currentTranslateX}px), calc(-50% + ${currentTranslateY}px)) scale(${currentScale}) rotate(${currentRotation}deg)`;
  }

  function resetOverlayTransform() {
    currentScale = 1;
    currentRotation = 0;
    currentTranslateX = 0;
    currentTranslateY = 0;
    updateOverlayTransform();
  }

  function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.hypot(dx, dy);
  }

  function angleBetween(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Camera not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      videoEl.srcObject = stream;
      setStatus("Camera ready. Drag, pinch and rotate the design.");
      if (snapshotBtn) {
        snapshotBtn.disabled = false;
      }
    } catch (err) {
      console.error("Camera error", err);
      setStatus("Could not access camera. Please allow camera permission.");
    }
  }

  async function loadDesignById(id, markActive) {
    if (!id || typeof db === "undefined") return;

    try {
      const doc = await db.collection("embroideryDesigns").doc(id).get();
      if (!doc.exists) return;
      const data = doc.data();
      const url = data.arTextureUrl || data.imageUrl || data.thumbnailUrl || null;
      if (!url) return;

      overlayEl.src = url;
      overlayEl.style.opacity = "0.9";
      resetOverlayTransform();
      activeDesignId = id;

      if (markActive && designStripEl) {
        Array.from(designStripEl.children).forEach((el) => {
          if (el.dataset && el.dataset.designId === id) {
            el.classList.add("active");
          } else {
            el.classList.remove("active");
          }
        });
      }
    } catch (e) {
      console.error("Failed to load design", e);
    }
  }

  async function loadDesignOptions() {
    if (!designStripEl || typeof db === "undefined") return;

    try {
      const snapshot = await db.collection("embroideryDesigns").limit(12).get();
      designStripEl.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        const thumbUrl = data.thumbnailUrl || data.imageUrl || data.arTextureUrl;
        if (!thumbUrl) return;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "design-chip" + (id === activeDesignId ? " active" : "");
        chip.dataset.designId = id;

        const img = document.createElement("img");
        img.src = thumbUrl;
        img.alt = data.name || "Embroidery design";

        const label = document.createElement("span");
        label.textContent = data.name || "Design";

        chip.appendChild(img);
        chip.appendChild(label);

        chip.addEventListener("click", () => {
          loadDesignById(id, true);
        });

        designStripEl.appendChild(chip);
      });
    } catch (e) {
      console.error("Failed to load design list", e);
    }
  }

  function setupPointerInteractions() {
    overlayEl.style.touchAction = "none";

    overlayEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      overlayEl.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
      } else if (activePointers.size === 2) {
        const points = Array.from(activePointers.values());
        pinchStartDistance = distance(points[0], points[1]);
        pinchStartAngle = angleBetween(points[0], points[1]);
        pinchStartScale = currentScale;
        pinchStartRotation = currentRotation;
        isDragging = false;
      }
    });

    overlayEl.addEventListener("pointermove", (e) => {
      if (!activePointers.has(e.pointerId)) return;
      e.preventDefault();
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1 && isDragging) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        currentTranslateX += dx;
        currentTranslateY += dy;
        updateOverlayTransform();
      } else if (activePointers.size === 2) {
        const points = Array.from(activePointers.values());
        const dist = distance(points[0], points[1]);
        const ang = angleBetween(points[0], points[1]);

        if (pinchStartDistance > 0) {
          const scaleFactor = dist / pinchStartDistance;
          currentScale = Math.min(3, Math.max(0.4, pinchStartScale * scaleFactor));
        }

        currentRotation = pinchStartRotation + (ang - pinchStartAngle);
        updateOverlayTransform();
      }
    });

    function endPointer(e) {
      if (activePointers.has(e.pointerId)) {
        activePointers.delete(e.pointerId);
      }

      if (activePointers.size === 0) {
        isDragging = false;
      } else if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.values())[0];
        dragStartX = remaining.x;
        dragStartY = remaining.y;
        isDragging = true;
      }
    }

    overlayEl.addEventListener("pointerup", endPointer);
    overlayEl.addEventListener("pointercancel", endPointer);
    overlayEl.addEventListener("pointerout", endPointer);
  }

  function setupWheelZoom() {
    overlayEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1;
      currentScale = Math.min(3, Math.max(0.4, currentScale * factor));
      updateOverlayTransform();
    });
  }

  function setupScreenshotCapture() {
    if (!snapshotBtn || !captureCanvas) return;

    snapshotBtn.addEventListener("click", () => {
      if (!videoEl.videoWidth || !videoEl.videoHeight) {
        setStatus("Camera not ready for capture yet.");
        return;
      }

      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;
      captureCanvas.width = width;
      captureCanvas.height = height;
      const ctx = captureCanvas.getContext("2d");

      const saveImage = (canvas, filename, message) => {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

          if (isIOS) {
            window.open(dataUrl, "_blank");
          } else {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }

          if (message) {
            setStatus(message);
          } else {
            setStatus("Screenshot captured.");
          }
        } catch (err) {
          console.error("Screenshot save failed", err);
          setStatus("Screenshot failed.");
        }
      };

      // Always draw camera first
      ctx.drawImage(videoEl, 0, 0, width, height);

      let overlayDrawn = false;

      if (overlayEl.complete && overlayEl.naturalWidth && overlayEl.naturalHeight) {
        try {
          const baseWidth = width * 0.6;
          const baseHeight = (overlayEl.naturalHeight / overlayEl.naturalWidth) * baseWidth;

          const centerX = width / 2 + currentTranslateX;
          const centerY = height / 2 + currentTranslateY;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((currentRotation * Math.PI) / 180);
          ctx.scale(currentScale, currentScale);
          ctx.globalAlpha = 0.95;
          ctx.drawImage(
            overlayEl,
            -baseWidth / 2,
            -baseHeight / 2,
            baseWidth,
            baseHeight
          );
          ctx.restore();
          overlayDrawn = true;
        } catch (e) {
          console.error("Overlay draw failed, capturing camera only", e);
        }
      }

      // Try to save combined image; if canvas is tainted by overlay, fall back to camera-only
      try {
        saveImage(captureCanvas, "embroidery-preview.png", overlayDrawn
          ? "Screenshot captured with overlay."
          : "Screenshot captured.");
      } catch (e) {
        console.error("Primary screenshot failed, falling back to camera only", e);
        try {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tctx = tempCanvas.getContext("2d");
          tctx.drawImage(videoEl, 0, 0, width, height);
          saveImage(tempCanvas, "embroidery-preview-camera-only.png", "Screenshot captured (camera only).");
        } catch (e2) {
          console.error("Fallback screenshot failed", e2);
          setStatus("Screenshot failed.");
        }
      }
    });
  }

  async function init() {
    setStatus("Initializing camera...");
    setupPointerInteractions();
    setupWheelZoom();
    setupScreenshotCapture();
    await startCamera();

    if (primaryDesignId) {
      await loadDesignById(primaryDesignId, true);
    }
    await loadDesignOptions();

    if (!overlayEl.src) {
      setStatus("Camera ready. Add designs from admin panel.");
    }
  }

  init();
})();
