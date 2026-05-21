(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; customization builder will not work.");
    return;
  }

  const env = window.APP_ENV || {};
  const cloudinaryConfig = env.CLOUDINARY || {};
  const CLOUD_NAME = cloudinaryConfig.cloudName || "";
  const CLOUD_UPLOAD_PRESET = cloudinaryConfig.unsignedUploadPreset || "";
  const UPI_CONFIG = env.UPI || {};

  const SHOP_UPI_ID = UPI_CONFIG.id || "yourshop@upi";
  const SHOP_UPI_QR = UPI_CONFIG.qrImageUrl || "assets/images/upi-placeholder.png";

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  const materialId = getQueryParam("materialId");

  const materialImageEl = document.getElementById("material-image");
  const materialNameEl = document.getElementById("material-name");
  const materialFabricEl = document.getElementById("material-fabric");
  const materialTextureEl = document.getElementById("material-texture");
  const materialPriceEl = document.getElementById("material-price");

  const customerNameEl = document.getElementById("customer-name");
  const customerPhoneEl = document.getElementById("customer-phone");
  const neckTypeEl = document.getElementById("neck-type");
  const sleeveTypeEl = document.getElementById("sleeve-type");
  const neckCustomWrapperEl = document.getElementById("neck-custom-wrapper");
  const neckCustomTextEl = document.getElementById("neck-custom-text");
  const sleeveCustomWrapperEl = document.getElementById("sleeve-custom-wrapper");
  const sleeveCustomTextEl = document.getElementById("sleeve-custom-text");
  const topLengthEl = document.getElementById("top-length");
  const sleeveLengthEl = document.getElementById("sleeve-length");
  const bottomLengthEl = document.getElementById("bottom-length");
  const pantStyleEl = document.getElementById("pant-style");
  const pantCustomWrapperEl = document.getElementById("pant-custom-wrapper");
  const pantCustomTextEl = document.getElementById("pant-custom-text");

  const embroiderySelectEl = document.getElementById("embroidery-design");
  const placementSelectEl = document.getElementById("emb-placement");
  const embDesignNotesEl = document.getElementById("emb-design-notes");
  const embAddBtnEl = document.getElementById("emb-add-btn");
  const embSelectedListEl = document.getElementById("emb-selected-list");

  const customDesignImageEl = document.getElementById("custom-design-image");
  const customDesignNotesEl = document.getElementById("custom-design-notes");
  const customEmbAddBtnEl = document.getElementById("custom-emb-add-btn");

  const chestEl = document.getElementById("chest");
  const waistEl = document.getElementById("waist");
  const hipEl = document.getElementById("hip");
  const shoulderWidthEl = document.getElementById("shoulder-width");
  const topLengthMeasureEl = document.getElementById("top-length-measure");
  const frontNeckDepthEl = document.getElementById("front-neck-depth");
  const backNeckDepthEl = document.getElementById("back-neck-depth");

  const priceMaterialEl = document.getElementById("price-material");
  const priceStitchingEl = document.getElementById("price-stitching");
  const priceEmbroideryEl = document.getElementById("price-embroidery");
  const priceTotalEl = document.getElementById("price-total");
  const priceAdvanceEl = document.getElementById("price-advance");

  const orderSummaryTextEl = document.getElementById("order-summary-text");
  const orderStatusEl = document.getElementById("order-status");
  const whatsappOrderEl = document.getElementById("whatsapp-order");
  const orderForm = document.getElementById("order-form");
  const addDressBtnEl = document.getElementById("add-dress-btn");
  const addToCartBtnEl = document.getElementById("add-to-cart-btn");

  const upiIdTextEl = document.getElementById("upi-id-text");
  const upiQrImageEl = document.getElementById("upi-qr-image");

    const customDesignToggleEl = document.getElementById("custom-design-toggle");
    const catalogEmbSectionEl = document.getElementById("catalog-emb-section");
    const customEmbSectionEl = document.getElementById("custom-emb-section");
    const embPreviewImgEl = document.getElementById("emb-preview-img");
    const embFullOverlayEl = document.getElementById("emb-full-overlay");
    const embFullImgEl = document.getElementById("emb-full-img");
    const embFullCloseBtn = document.getElementById("emb-full-close");

  const wizardSteps = document.querySelectorAll(".wizard-step");
  const step1NextBtn = document.getElementById("step1-next");
  const step2NextBtn = document.getElementById("step2-next");
  const step2BackBtn = document.getElementById("step2-back");
  const step3NextBtn = document.getElementById("step3-next");
  const step3BackBtn = document.getElementById("step3-back");
  const step4BackBtn = document.getElementById("step4-back");

  let currentStep = 1;

  const STITCHING_CHARGE = 600;
  const ADVANCE_PERCENT = 0.4;

  let materialData = null;
  let embroideryMap = new Map(); // id -> data
  let embroideryItems = []; // { id, name, placement, notes, price, imageUrl, kind }

  function formatPrice(p) {
    if (!p || p <= 0) return "₹0";
    return "₹" + Math.round(p).toLocaleString();
  }

  function getSelectedPlacements() {
    if (!placementSelectEl) return [];
    const v = placementSelectEl.value;
    return v ? [v] : [];
  }

  async function uploadFileToCloudinary(file, folder) {
    if (!file) return null;
    if (!CLOUD_NAME || !CLOUD_UPLOAD_PRESET) {
      console.warn("Cloudinary config missing; cannot upload file.");
      return null;
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUD_UPLOAD_PRESET);
    if (folder) formData.append("folder", folder);

    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const json = await res.json();
    return json.secure_url || json.url || null;
  }

  async function loadMaterial() {
    if (!materialId) {
      if (materialNameEl) materialNameEl.textContent = "No material selected.";
      return;
    }

    try {
      const doc = await db.collection("materials").doc(materialId).get();
      if (!doc.exists) {
        if (materialNameEl) materialNameEl.textContent = "Material not found.";
        return;
      }
      materialData = doc.data();

      const imgUrl = materialData.imageUrl || materialData.textureUrl || "https://via.placeholder.com/500x400?text=Material";
      if (materialImageEl) {
        materialImageEl.src = imgUrl;
      }
      if (materialNameEl) {
        materialNameEl.textContent = materialData.name || "";
      }
      if (materialFabricEl) {
        materialFabricEl.textContent = materialData.fabricType
          ? "Fabric: " + materialData.fabricType.charAt(0).toUpperCase() + materialData.fabricType.slice(1)
          : "";
      }
      if (materialTextureEl) {
        materialTextureEl.textContent = materialData.textureDescription || "";
      }
      if (materialPriceEl) {
        const base = Number(materialData.basePrice || materialData.price || 0);
        materialPriceEl.textContent = base ? `Material price: ₹${base.toLocaleString()}` : "Material price: On request";
      }

      updatePricing();
      updateSummary();
    } catch (e) {
      console.error("Failed to load material", e);
      if (materialNameEl) materialNameEl.textContent = "Material load failed.";
    }
  }

  async function loadEmbroideryDesigns() {
    if (!embroiderySelectEl) return;
    try {
      const snapshot = await db.collection("embroideryDesigns").orderBy("name").limit(50).get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        embroideryMap.set(doc.id, data);
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = data.name || "Design";
        embroiderySelectEl.appendChild(option);
      });
    } catch (e) {
      console.error("Failed to load embroidery designs", e);
    }
  }

  function calculatePricing() {
    const base = materialData ? Number(materialData.basePrice || materialData.price || 0) : 0;
    const stitching = STITCHING_CHARGE;

    let embroideryPrice = 0;
    if (Array.isArray(embroideryItems) && embroideryItems.length) {
      embroideryItems.forEach((item) => {
        embroideryPrice += Number(item.price || 0);
      });
    } else {
      const embroideryId = embroiderySelectEl ? embroiderySelectEl.value : "";
      if (embroideryId && embroideryMap.has(embroideryId)) {
        const d = embroideryMap.get(embroideryId);
        embroideryPrice = Number(d.price || 0);
      }
    }

    const total = base + stitching + embroideryPrice;
    const advance = total * ADVANCE_PERCENT;

    return {
      base,
      stitching,
      embroideryPrice,
      total,
      advance,
    };
  }

  function updatePricing() {
    const p = calculatePricing();
    if (priceMaterialEl) priceMaterialEl.textContent = formatPrice(p.base);
    if (priceStitchingEl) priceStitchingEl.textContent = formatPrice(p.stitching);
    if (priceEmbroideryEl) priceEmbroideryEl.textContent = formatPrice(p.embroideryPrice);
    if (priceTotalEl) priceTotalEl.innerHTML = `<strong>${formatPrice(p.total)}</strong>`;
    if (priceAdvanceEl) priceAdvanceEl.textContent = formatPrice(p.advance);
  }

  function updateEmbPreview() {
    if (!embPreviewImgEl) return;
    const id = embroiderySelectEl ? embroiderySelectEl.value : "";
    if (id && embroideryMap.has(id)) {
      const d = embroideryMap.get(id);
      const imgUrl = d.previewImageUrl || d.imageUrl || "";
      if (imgUrl) {
        embPreviewImgEl.src = imgUrl;
        embPreviewImgEl.style.display = "block";
      } else {
        embPreviewImgEl.style.display = "none";
      }
    } else {
      embPreviewImgEl.style.display = "none";
    }
  }

  function showStep(step) {
    wizardSteps.forEach((el) => {
      if (!el.dataset.step) return;
      const s = parseInt(el.dataset.step, 10);
      if (s === step) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
    currentStep = step;
    if (orderForm) {
      orderForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function validateStep(step) {
    if (step === 1) {
      const name = customerNameEl.value.trim();
      const phone = customerPhoneEl.value.trim();
      const neck = neckTypeEl.value;
      const sleeve = sleeveTypeEl.value;
      const neckCustom = neck === "custom" && neckCustomTextEl && neckCustomTextEl.value.trim();
      const sleeveCustom = sleeve === "custom" && sleeveCustomTextEl && sleeveCustomTextEl.value.trim();

      if (
        !name ||
        !phone ||
        !neck ||
        !sleeve ||
        (neck === "custom" && !neckCustom) ||
        (sleeve === "custom" && !sleeveCustom)
      ) {
        if (orderStatusEl) {
          orderStatusEl.textContent =
            "Please fill customer name, mobile and choose neck/sleeve (and custom text if selected).";
        }
        return false;
      }
    }

    if (step === 2) {
      const requiredFields = [
        { el: topLengthEl, label: "Top length" },
        { el: pantStyleEl, label: "Pant style" },
        { el: bottomLengthEl, label: "Bottom length" },
        { el: chestEl, label: "Chest" },
        { el: waistEl, label: "Waist" },
        { el: hipEl, label: "Hip" },
        { el: shoulderWidthEl, label: "Shoulder width" },
        { el: sleeveLengthEl, label: "Sleeve length" },
        { el: topLengthMeasureEl, label: "Top length (measurement)" },
        { el: frontNeckDepthEl, label: "Front neck depth" },
        { el: backNeckDepthEl, label: "Back neck depth" },
      ];

      const missing = requiredFields
        .filter((f) => !f.el || !f.el.value || !f.el.value.trim())
        .map((f) => f.label);

      if (pantStyleEl && pantStyleEl.value === "custom") {
        const v = pantCustomTextEl && pantCustomTextEl.value.trim();
        if (!v) {
          missing.push("Pant style (custom text)");
        }
      }

      if (missing.length) {
        if (orderStatusEl) {
          orderStatusEl.textContent = "Please fill these fields: " + missing.join(", ") + ".";
        }
        return false;
      }
    }

    if (step === 3) {
      const useCustom = customDesignToggleEl && customDesignToggleEl.checked;

      if (!useCustom) {
        // Catalog embroidery: allow no embroidery at all,
        // or one/many added via the + button. No extra mandatory fields here.
        if (orderStatusEl) {
          orderStatusEl.textContent = "";
        }
      } else {
        const hasFile = customDesignImageEl && customDesignImageEl.files && customDesignImageEl.files[0];
        const notes = customDesignNotesEl ? customDesignNotesEl.value.trim() : "";

        if (!hasFile || !notes) {
          if (orderStatusEl) {
            orderStatusEl.textContent =
              "Please upload your custom design image and enter notes for embroidery.";
          }
          return false;
        }
      }
    }
    if (orderStatusEl) {
      orderStatusEl.textContent = "";
    }
    return true;
  }

  function buildSummaryText() {
    const pricing = calculatePricing();

    const materialLine = materialData
      ? `${materialData.name || "Material"} (${materialData.fabricType || ""})`
      : "Material not selected";

    let neck = "-";
    if (neckTypeEl && neckTypeEl.value) {
      if (neckTypeEl.value === "custom" && neckCustomTextEl && neckCustomTextEl.value.trim()) {
        neck = `Custom: ${neckCustomTextEl.value.trim()}`;
      } else {
        neck = neckTypeEl.options[neckTypeEl.selectedIndex].text;
      }
    }

    let sleeve = "-";
    if (sleeveTypeEl && sleeveTypeEl.value) {
      if (sleeveTypeEl.value === "custom" && sleeveCustomTextEl && sleeveCustomTextEl.value.trim()) {
        sleeve = `Custom: ${sleeveCustomTextEl.value.trim()}`;
      } else {
        sleeve = sleeveTypeEl.options[sleeveTypeEl.selectedIndex].text;
      }
    }

    let pant = "-";
    if (pantStyleEl && pantStyleEl.value) {
      if (pantStyleEl.value === "custom" && pantCustomTextEl && pantCustomTextEl.value.trim()) {
        pant = `Custom: ${pantCustomTextEl.value.trim()}`;
      } else {
        pant = pantStyleEl.options[pantStyleEl.selectedIndex].text;
      }
    }

    let embroiderySummary = "None";
    if (Array.isArray(embroideryItems) && embroideryItems.length) {
      embroiderySummary = embroideryItems
        .map((item, idx) => {
          const label = item.name || "Embroidery design";
          const place = item.placement || "-";
          return `${idx + 1}) ${label} (${place})`;
        })
        .join("; ");
    } else {
      const embroideryId = embroiderySelectEl ? embroiderySelectEl.value : "";
      if (embroideryId && embroideryMap.has(embroideryId)) {
        embroiderySummary = (embroideryMap.get(embroideryId).name || "Embroidery design") +
          (placementSelectEl && placementSelectEl.value
            ? ` (${placementSelectEl.options[placementSelectEl.selectedIndex].text})`
            : "");
      }
    }

    const summary = [
      `Material: ${materialLine}`,
      `Neck: ${neck}`,
      `Sleeve: ${sleeve}`,
      `Pant style: ${pant}`,
      `Top length (style): ${topLengthEl.value || "-"}`,
      `Bottom length: ${bottomLengthEl.value || "-"}`,
      `Embroidery: ${embroiderySummary}`,
      `Embroidery notes: ${embDesignNotesEl && embDesignNotesEl.value ? embDesignNotesEl.value : (customDesignNotesEl && customDesignNotesEl.value ? customDesignNotesEl.value : "-")}`,
      `Measurements - Chest: ${chestEl && chestEl.value ? chestEl.value : "-"}, Waist: ${waistEl && waistEl.value ? waistEl.value : "-"}, Hip: ${hipEl && hipEl.value ? hipEl.value : "-"}, Shoulder width: ${shoulderWidthEl && shoulderWidthEl.value ? shoulderWidthEl.value : "-"}, Sleeve length: ${sleeveLengthEl && sleeveLengthEl.value ? sleeveLengthEl.value : "-"}, Top length: ${topLengthMeasureEl && topLengthMeasureEl.value ? topLengthMeasureEl.value : "-"}, Front neck depth: ${frontNeckDepthEl && frontNeckDepthEl.value ? frontNeckDepthEl.value : "-"}, Back neck depth: ${backNeckDepthEl && backNeckDepthEl.value ? backNeckDepthEl.value : "-"}`,
      `Estimated total: ${formatPrice(pricing.total)}`,
      `Approx. advance (40%): ${formatPrice(pricing.advance)}`,
    ];

    return summary.join("\n");
  }

  function updateSummary() {
    if (!orderSummaryTextEl) return;
    orderSummaryTextEl.textContent = buildSummaryText();
  }

  function buildWhatsappMessage() {
    const name = customerNameEl.value.trim() || "Customer";
    const phone = customerPhoneEl.value.trim();
    const summary = buildSummaryText();
    const pricing = calculatePricing();
    let msg = `Chudithar Order Request - ${name}%0A`;
    if (phone) {
      msg += `Phone: ${phone}%0A`;
    }
    msg += `Advance amount to pay (UPI): ${formatPrice(pricing.advance)}%0A`;
    msg += `Paid via UPI to: ${SHOP_UPI_ID}%0A`;
    msg += `%0A${summary.replace(/\n/g, "%0A")}`;
    return msg;
  }

  function wireLiveUpdates() {
    const fields = [
      neckTypeEl,
      sleeveTypeEl,
      topLengthEl,
      bottomLengthEl,
      pantStyleEl,
      embroiderySelectEl,
      placementSelectEl,
      chestEl,
      waistEl,
      hipEl,
      shoulderWidthEl,
      sleeveLengthEl,
      topLengthMeasureEl,
      frontNeckDepthEl,
      backNeckDepthEl,
      neckCustomTextEl,
      sleeveCustomTextEl,
      pantCustomTextEl,
    ];

    fields.forEach((el) => {
      if (!el) return;
      el.addEventListener("change", () => {
        updatePricing();
        updateSummary();
        if (el === embroiderySelectEl) {
          updateEmbPreview();
        }
      });
      el.addEventListener("input", () => {
        updatePricing();
        updateSummary();
      });
    });
  }

  function renderEmbroideryItemsList() {
    if (!embSelectedListEl) return;

    if (!embroideryItems.length) {
      embSelectedListEl.textContent = "No embroidery added yet.";
      return;
    }

    const fragments = embroideryItems.map((item, idx) => {
      const name = item.name || "Embroidery design";
      const placement = item.placement || "-";
      const priceText = item.price ? formatPrice(item.price) : "";
      const img = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${name}" />`
        : "";

      return `
        <div class="emb-selected-item">
          <div class="emb-selected-thumb">${img}</div>
          <div class="emb-selected-info">
            <div class="emb-selected-name">${idx + 1}) ${name}</div>
            <div class="emb-selected-meta">${placement}${priceText ? ` · ${priceText}` : ""}</div>
          </div>
        </div>
      `;
    });

    embSelectedListEl.innerHTML = `<div class="emb-selected-grid">${fragments.join("")}</div>`;
  }

  function addEmbroideryFromCurrentFields() {
    if (!embroiderySelectEl) return;

    const embId = embroiderySelectEl.value;
    const placementVal = placementSelectEl ? placementSelectEl.value : "";
    const notesVal = embDesignNotesEl ? embDesignNotesEl.value.trim() : "";

    if (!embId) {
      if (orderStatusEl) {
        orderStatusEl.textContent = "Please select an embroidery design before adding.";
      }
      return;
    }

    if (!placementVal) {
      if (orderStatusEl) {
        orderStatusEl.textContent =
          "Please choose placement before adding this embroidery.";
      }
      return;
    }

    if (!embroideryMap.has(embId)) {
      if (orderStatusEl) {
        orderStatusEl.textContent = "Selected embroidery design could not be found.";
      }
      return;
    }

    const data = embroideryMap.get(embId);
    const item = {
      id: embId,
      name: data.name || "Embroidery design",
      placement: placementVal,
      notes: notesVal,
      price: Number(data.price || 0),
      imageUrl: data.previewImageUrl || data.imageUrl || "",
      kind: "catalog",
    };

    embroideryItems.push(item);

    // Clear current inputs for next addition
    embroiderySelectEl.value = "";
    if (placementSelectEl) placementSelectEl.value = "";
    if (embDesignNotesEl) embDesignNotesEl.value = "";
    updateEmbPreview();

    if (orderStatusEl) {
      orderStatusEl.textContent = "Embroidery added to order.";
    }

    renderEmbroideryItemsList();
    updatePricing();
    updateSummary();
  }

  function wireEmbroideryAddButton() {
    if (!embAddBtnEl) return;
    embAddBtnEl.addEventListener("click", addEmbroideryFromCurrentFields);
  }

  function addCustomEmbroideryFromCurrentFields() {
    if (!customDesignImageEl) return;

    const file = customDesignImageEl.files && customDesignImageEl.files[0];
    const notesVal = customDesignNotesEl ? customDesignNotesEl.value.trim() : "";

    if (!file) {
      if (orderStatusEl) {
        orderStatusEl.textContent = "Please choose a custom design image before adding.";
      }
      return;
    }

    // Only allow one custom design entry to avoid duplicates
    const existingCustom = embroideryItems.some((it) => it.kind === "custom");
    if (existingCustom) {
      if (orderStatusEl) {
        orderStatusEl.textContent = "Custom design already added. You can update notes if needed.";
      }
      return;
    }

    const localUrl = URL.createObjectURL(file);

    embroideryItems.push({
      id: "custom",
      name: "Custom design",
      placement: "Custom",
      notes: notesVal,
      price: 0,
      imageUrl: localUrl,
      kind: "custom",
    });

    renderEmbroideryItemsList();
    updatePricing();
    updateSummary();

    if (orderStatusEl) {
      orderStatusEl.textContent = "Custom design added to order.";
    }
  }

  function wireCustomEmbAddButton() {
    if (!customEmbAddBtnEl) return;
    customEmbAddBtnEl.addEventListener("click", addCustomEmbroideryFromCurrentFields);
  }

  function wireEmbPreviewModal() {
    if (!embPreviewImgEl || !embFullOverlayEl || !embFullImgEl) return;

    embPreviewImgEl.addEventListener("click", () => {
      if (!embPreviewImgEl.src) return;
      embFullImgEl.src = embPreviewImgEl.src;
      embFullOverlayEl.classList.remove("hidden");
    });

    if (embFullCloseBtn) {
      embFullCloseBtn.addEventListener("click", () => {
        embFullOverlayEl.classList.add("hidden");
      });
    }

    embFullOverlayEl.addEventListener("click", (e) => {
      if (e.target === embFullOverlayEl) {
        embFullOverlayEl.classList.add("hidden");
      }
    });
  }

  function updateEmbSections() {
    if (!customDesignToggleEl) return;
    const useCustom = customDesignToggleEl.checked;
    if (catalogEmbSectionEl) {
      catalogEmbSectionEl.style.display = useCustom ? "none" : "";
    }
    if (customEmbSectionEl) {
      customEmbSectionEl.style.display = useCustom ? "" : "none";
    }
    if (useCustom && embroiderySelectEl) {
      embroiderySelectEl.value = "";
      if (placementSelectEl) placementSelectEl.value = "";
      updatePricing();
      updateSummary();
      updateEmbPreview();
    }
  }

  function wireCustomToggle() {
    if (!customDesignToggleEl) return;
    updateEmbSections();
    customDesignToggleEl.addEventListener("change", updateEmbSections);
  }

  function wireCustomTypeVisibility() {
    updateCustomTypeVisibility();
    if (neckTypeEl) {
      neckTypeEl.addEventListener("change", () => {
        updateCustomTypeVisibility();
        updateSummary();
      });
    }
    if (sleeveTypeEl) {
      sleeveTypeEl.addEventListener("change", () => {
        updateCustomTypeVisibility();
        updateSummary();
      });
    }
    if (pantStyleEl) {
      pantStyleEl.addEventListener("change", () => {
        updateCustomTypeVisibility();
        updateSummary();
      });
    }
  }

  function updateCustomTypeVisibility() {
    if (neckCustomWrapperEl) {
      const show = neckTypeEl && neckTypeEl.value === "custom";
      neckCustomWrapperEl.style.display = show ? "block" : "none";
    }
    if (sleeveCustomWrapperEl) {
      const show = sleeveTypeEl && sleeveTypeEl.value === "custom";
      sleeveCustomWrapperEl.style.display = show ? "block" : "none";
    }
    if (pantCustomWrapperEl) {
      const show = pantStyleEl && pantStyleEl.value === "custom";
      pantCustomWrapperEl.style.display = show ? "block" : "none";
    }
  }

  function wireWizardNav() {
    if (step1NextBtn) {
      step1NextBtn.addEventListener("click", () => {
        if (!validateStep(1)) return;
        showStep(2);
      });
    }

    if (step2NextBtn) {
      step2NextBtn.addEventListener("click", () => {
        if (!validateStep(2)) return;
        showStep(3);
      });
    }

    if (step2BackBtn) {
      step2BackBtn.addEventListener("click", () => {
        showStep(1);
      });
    }

    if (step3BackBtn) {
      step3BackBtn.addEventListener("click", () => {
        showStep(2);
      });
    }

    if (step3NextBtn) {
      step3NextBtn.addEventListener("click", () => {
        if (!validateStep(3)) return;
        showStep(4);
      });
    }

    if (step4BackBtn) {
      step4BackBtn.addEventListener("click", () => {
        showStep(3);
      });
    }
  }

  async function saveDressToCart(resetAfter) {
    if (!orderForm) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    orderStatusEl.textContent = "Saving dress to cart...";

    const customerName = customerNameEl.value.trim();
    const customerPhone = customerPhoneEl.value.trim();

    const pricing = calculatePricing();

    const finalEmbItems = Array.isArray(embroideryItems) ? [...embroideryItems] : [];

    const measurements = {
      chest: chestEl && chestEl.value ? chestEl.value : "",
      waist: waistEl && waistEl.value ? waistEl.value : "",
      hip: hipEl && hipEl.value ? hipEl.value : "",
      shoulderWidth: shoulderWidthEl && shoulderWidthEl.value ? shoulderWidthEl.value : "",
      sleeveLength: sleeveLengthEl && sleeveLengthEl.value ? sleeveLengthEl.value : "",
      topLength: topLengthMeasureEl && topLengthMeasureEl.value ? topLengthMeasureEl.value : "",
      frontNeckDepth: frontNeckDepthEl && frontNeckDepthEl.value ? frontNeckDepthEl.value : "",
      backNeckDepth: backNeckDepthEl && backNeckDepthEl.value ? backNeckDepthEl.value : "",
      topLengthStyle: topLengthEl && topLengthEl.value ? topLengthEl.value : "",
      bottomLength: bottomLengthEl && bottomLengthEl.value ? bottomLengthEl.value : "",
    };

    let customDesignUrl = null;
    const customFile = customDesignImageEl.files && customDesignImageEl.files[0];
    try {
      if (customFile) {
        customDesignUrl = await uploadFileToCloudinary(customFile, "custom-designs");
      }
    } catch (e) {
      console.error("Custom design upload failed (cart)", e);
    }

    const cartDoc = {
      customerName,
      phone: customerPhone,
      materialId: materialId || "",
      materialName: materialData && materialData.name ? materialData.name : "",
      materialFabric: materialData && materialData.fabricType ? materialData.fabricType : "",
      materialPrice: pricing.base,
      neckType: neckTypeEl.value,
      sleeveType: sleeveTypeEl.value,
      neckCustomText:
        neckCustomTextEl && neckCustomTextEl.value.trim() ? neckCustomTextEl.value.trim() : "",
      sleeveCustomText:
        sleeveCustomTextEl && sleeveCustomTextEl.value.trim() ? sleeveCustomTextEl.value.trim() : "",
      topLength: topLengthEl.value || "",
      sleeveLength: sleeveLengthEl.value || "",
      pantStyle: pantStyleEl.value || "",
      pantCustomText:
        pantCustomTextEl && pantCustomTextEl.value.trim() ? pantCustomTextEl.value.trim() : "",
      bottomLength: bottomLengthEl && bottomLengthEl.value ? bottomLengthEl.value : "",
      embroideryItems: finalEmbItems,
      embroideryDesignID: finalEmbItems.length ? finalEmbItems[0].id : "",
      embroideryDesignName: finalEmbItems.length ? finalEmbItems[0].name : "",
      placement: finalEmbItems.length ? [finalEmbItems[0].placement || ""] : [],
      measurements,
      embroideryDesignNotes:
        finalEmbItems.length && finalEmbItems[0].notes
          ? finalEmbItems[0].notes
          : embDesignNotesEl && embDesignNotesEl.value
          ? embDesignNotesEl.value.trim()
          : "",
      customDesignImage: customDesignUrl || "",
      customDesignNotes: customDesignNotesEl.value.trim() || "",
      stitchingCharge: pricing.stitching,
      embroideryPrice: pricing.embroideryPrice,
      totalPrice: pricing.total,
      advanceAmount: pricing.advance,
      cartStatus: "In Cart",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await db.collection("carts").add(cartDoc);
      orderStatusEl.textContent = "Dress saved to cart. You can place it later from My Orders.";
      if (resetAfter && orderForm) {
        orderForm.reset();
        embroideryItems = [];
        renderEmbroideryItemsList();
        updatePricing();
        updateSummary();
        showStep(1);
      }
    } catch (e) {
      console.error("Failed to save dress to cart", e);
      orderStatusEl.textContent = "Could not save to cart. Please try again.";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!orderForm) return;

    // Ensure all steps are valid before placing order
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    orderStatusEl.textContent = "Placing order...";

    const customerName = customerNameEl.value.trim();
    const customerPhone = customerPhoneEl.value.trim();

    const pricing = calculatePricing();

    // Final embroidery list is whatever was added via the + button
    const finalEmbItems = Array.isArray(embroideryItems) ? [...embroideryItems] : [];

    const measurements = {
      chest: chestEl && chestEl.value ? chestEl.value : "",
      waist: waistEl && waistEl.value ? waistEl.value : "",
      hip: hipEl && hipEl.value ? hipEl.value : "",
      shoulderWidth: shoulderWidthEl && shoulderWidthEl.value ? shoulderWidthEl.value : "",
      sleeveLength: sleeveLengthEl && sleeveLengthEl.value ? sleeveLengthEl.value : "",
      topLength: topLengthMeasureEl && topLengthMeasureEl.value ? topLengthMeasureEl.value : "",
      frontNeckDepth: frontNeckDepthEl && frontNeckDepthEl.value ? frontNeckDepthEl.value : "",
      backNeckDepth: backNeckDepthEl && backNeckDepthEl.value ? backNeckDepthEl.value : "",
      topLengthStyle: topLengthEl && topLengthEl.value ? topLengthEl.value : "",
      bottomLength: bottomLengthEl && bottomLengthEl.value ? bottomLengthEl.value : "",
    };

    let customDesignUrl = null;
    const customFile = customDesignImageEl.files && customDesignImageEl.files[0];
    try {
      if (customFile) {
        customDesignUrl = await uploadFileToCloudinary(customFile, "custom-designs");
      }
    } catch (e) {
      console.error("Custom design upload failed", e);
    }

    const orderDoc = {
      customerName,
      phone: customerPhone,
      materialId: materialId || "",
      materialName: materialData && materialData.name ? materialData.name : "",
      materialFabric: materialData && materialData.fabricType ? materialData.fabricType : "",
      materialPrice: pricing.base,
      neckType: neckTypeEl.value,
      sleeveType: sleeveTypeEl.value,
      neckCustomText: neckCustomTextEl && neckCustomTextEl.value.trim() ? neckCustomTextEl.value.trim() : "",
      sleeveCustomText:
        sleeveCustomTextEl && sleeveCustomTextEl.value.trim() ? sleeveCustomTextEl.value.trim() : "",
      topLength: topLengthEl.value || "",
      sleeveLength: sleeveLengthEl.value || "",
      pantStyle: pantStyleEl.value || "",
      pantCustomText: pantCustomTextEl && pantCustomTextEl.value.trim() ? pantCustomTextEl.value.trim() : "",
      bottomLength: bottomLengthEl && bottomLengthEl.value ? bottomLengthEl.value : "",
      embroideryItems: finalEmbItems,
      embroideryDesignID: finalEmbItems.length ? finalEmbItems[0].id : "",
      embroideryDesignName: finalEmbItems.length ? finalEmbItems[0].name : "",
      placement: finalEmbItems.length ? [finalEmbItems[0].placement || ""] : [],
      measurements,
      embroideryDesignNotes:
        finalEmbItems.length && finalEmbItems[0].notes
          ? finalEmbItems[0].notes
          : embDesignNotesEl && embDesignNotesEl.value
          ? embDesignNotesEl.value.trim()
          : "",
      customDesignImage: customDesignUrl || "",
      customDesignNotes: customDesignNotesEl.value.trim() || "",
      stitchingCharge: pricing.stitching,
      embroideryPrice: pricing.embroideryPrice,
      totalPrice: pricing.total,
      advanceAmount: pricing.advance,
      paymentStatus: "Pending",
      orderStatus: "Received",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // For now each order has a single dress item, but we
    // structure it as an array so we can support multi-dress
    // orders in future without breaking existing data.
    orderDoc.orderItems = [
      {
        materialId: orderDoc.materialId,
        materialName: orderDoc.materialName,
        materialFabric: orderDoc.materialFabric,
        materialPrice: orderDoc.materialPrice,
        neckType: orderDoc.neckType,
        sleeveType: orderDoc.sleeveType,
        neckCustomText: orderDoc.neckCustomText,
        sleeveCustomText: orderDoc.sleeveCustomText,
        topLength: orderDoc.topLength,
        sleeveLength: orderDoc.sleeveLength,
        pantStyle: orderDoc.pantStyle,
        pantCustomText: orderDoc.pantCustomText,
        bottomLength: orderDoc.bottomLength,
        embroideryItems: orderDoc.embroideryItems,
        embroideryDesignID: orderDoc.embroideryDesignID,
        embroideryDesignName: orderDoc.embroideryDesignName,
        placement: orderDoc.placement,
        measurements: orderDoc.measurements,
        embroideryDesignNotes: orderDoc.embroideryDesignNotes,
        customDesignImage: orderDoc.customDesignImage,
        customDesignNotes: orderDoc.customDesignNotes,
        stitchingCharge: orderDoc.stitchingCharge,
        embroideryPrice: orderDoc.embroideryPrice,
        totalPrice: orderDoc.totalPrice,
        advanceAmount: orderDoc.advanceAmount,
      },
    ];

    try {
      await db.collection("orders").add(orderDoc);
      orderStatusEl.textContent = "Order request placed successfully. Redirecting to your orders...";
      const redirectPhone = encodeURIComponent(customerPhone);
      setTimeout(() => {
        window.location.href = `my-orders.html?phone=${redirectPhone}`;
      }, 800);
    } catch (e) {
      console.error("Failed to place order", e);
      orderStatusEl.textContent = "Could not place order. Please try again.";
    }
  }

  function initWhatsappButton() {
    if (!whatsappOrderEl) return;
    whatsappOrderEl.addEventListener("click", (e) => {
      e.preventDefault();
      const message = buildWhatsappMessage();
      const phone = "919789564443"; // shop phone
      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, "_blank");
    });
  }

  function initUpiSection() {
    if (upiIdTextEl) {
      upiIdTextEl.textContent = SHOP_UPI_ID;
    }
    if (upiQrImageEl) {
      upiQrImageEl.src = SHOP_UPI_QR;
    }
  }

  async function init() {
    await Promise.all([loadMaterial(), loadEmbroideryDesigns()]);
    updatePricing();
    updateSummary();
    wireLiveUpdates();
    wireWizardNav();
    updateEmbPreview();
    wireEmbPreviewModal();
    wireCustomToggle();
    wireCustomTypeVisibility();
    initWhatsappButton();
    wireEmbroideryAddButton();
    wireCustomEmbAddButton();
    initUpiSection();

    if (addDressBtnEl) {
      addDressBtnEl.addEventListener("click", () => {
        saveDressToCart(true);
      });
    }
    if (addToCartBtnEl) {
      addToCartBtnEl.addEventListener("click", () => {
        saveDressToCart(false);
      });
    }

    if (orderForm) {
      orderForm.addEventListener("submit", handleSubmit);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
