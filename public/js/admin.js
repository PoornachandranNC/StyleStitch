// Simple password-gated admin panel and Firestore-based design management

(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; admin panel will not work.");
    return;
  }

  const env = window.APP_ENV || {};
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin123";

  const cloudinaryConfig = env.CLOUDINARY || {};
  const CLOUD_NAME = cloudinaryConfig.cloudName || "";
  const CLOUD_UPLOAD_PRESET = cloudinaryConfig.unsignedUploadPreset || "";

  const loginSection = document.getElementById("admin-login");
  const panelSection = document.getElementById("admin-panel");
  const passwordInput = document.getElementById("admin-password");
  const loginBtn = document.getElementById("admin-login-btn");
  const loginError = document.getElementById("admin-login-error");

  if (!loginSection || !panelSection) return;

  // Simple tab handling inside admin panel
  const tabButtons = panelSection.querySelectorAll(".admin-tab-button");
  const tabSections = panelSection.querySelectorAll(".admin-tab-section");

  function showTab(name) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle("active", isActive);
    });
    tabSections.forEach((section) => {
      const isMatch = section.dataset.tab === name;
      section.hidden = !isMatch;
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.tab;
      if (name) {
        showTab(name);
      }
    });
  });

  function unlockPanel() {
    loginSection.hidden = true;
    panelSection.hidden = false;
    // Default to materials tab
    showTab("materials");
    loadDesigns();
    loadMaterialsAdmin();
    loadOrders();
  }

  loginBtn.addEventListener("click", () => {
    const value = passwordInput.value.trim();
    if (!value) {
      loginError.textContent = "Please enter the admin password.";
      return;
    }
    if (value !== ADMIN_PASSWORD) {
      loginError.textContent = "Incorrect password.";
      return;
    }
    loginError.textContent = "";
    unlockPanel();
  });

  // Design / item form handling
  const form = document.getElementById("design-form");
  const collectionInput = document.getElementById("design-collection");
  const idInput = document.getElementById("design-id");
  const typeSelect = document.getElementById("design-type");
  const nameInput = document.getElementById("design-name");
  const categorySelect = document.getElementById("design-category");
  const priceInput = document.getElementById("price");
  const descInput = document.getElementById("design-description");
  const placementCheckboxes = document.querySelectorAll(".placement-option");
  const imageInput = document.getElementById("design-image");
  const arTextureInput = document.getElementById("design-ar-texture");
  const resetBtn = document.getElementById("design-reset");
  const statusEl = document.getElementById("design-form-status");
  const listContainer = document.getElementById("admin-design-list");
  const placementRow = document.getElementById("placement-row");
  const arTextureRow = document.getElementById("ar-texture-row");
  const chudiGalleryRow = document.getElementById("chudi-gallery-row");
  const chudiGalleryInputs = document.querySelectorAll(".chudi-gallery-input");
  const ordersListContainer = document.getElementById("admin-orders-list");

  // Order detail modal elements
  const orderDetailOverlay = document.getElementById("order-detail-overlay");
  const orderDetailBody = document.getElementById("order-detail-body");
  const orderDetailCloseBtn = document.getElementById("order-detail-close");

  // Materials form elements
  const materialForm = document.getElementById("material-form");
  const materialIdInput = document.getElementById("material-id");
  const materialNameInput = document.getElementById("material-name");
  const materialFabricSelect = document.getElementById("material-fabric");
  const materialBasePriceInput = document.getElementById("material-base-price");
  const materialTextureDescInput = document.getElementById("material-texture-desc");
  const materialImageInput = document.getElementById("material-image");
  const materialResetBtn = document.getElementById("material-reset");
  const materialStatusEl = document.getElementById("material-form-status");
  const materialsListContainer = document.getElementById("admin-materials-list");
  const materialsPrevBtn = document.getElementById("materials-prev");
  const materialsNextBtn = document.getElementById("materials-next");
  const materialsPageInfoEl = document.getElementById("materials-page-info");

  let materialsAllDocs = [];
  const MATERIALS_PAGE_SIZE = 10;
  let materialsCurrentPage = 0;

  function setFormStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function getPlacementOptions() {
    const values = [];
    placementCheckboxes.forEach((c) => {
      if (c.checked) values.push(c.value);
    });
    return values;
  }

  function setPlacementOptions(options) {
    placementCheckboxes.forEach((c) => {
      c.checked = Array.isArray(options) && options.includes(c.value);
    });
  }

  function resetForm() {
    idInput.value = "";
    collectionInput.value = "embroideryDesigns";
    typeSelect.value = "embroidery";
    nameInput.value = "";
    categorySelect.value = "neck";
    priceInput.value = "";
    descInput.value = "";
    placementCheckboxes.forEach((c) => (c.checked = false));
    imageInput.value = "";
    arTextureInput.value = "";
    chudiGalleryInputs.forEach((i) => (i.value = ""));
    setFormStatus("");
    updateTypeSpecificFields();
  }

  function updateTypeSpecificFields() {
    const isEmbroidery = typeSelect.value === "embroidery";
    if (placementRow) placementRow.style.display = isEmbroidery ? "flex" : "none";
    if (arTextureRow) arTextureRow.style.display = isEmbroidery ? "flex" : "none";
    if (chudiGalleryRow) chudiGalleryRow.style.display = isEmbroidery ? "none" : "flex";
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      // When changing type on a new item, update default collection
      if (!idInput.value) {
        collectionInput.value =
          typeSelect.value === "chudithar" ? "chudithars" : "embroideryDesigns";
      }
      updateTypeSpecificFields();
    });
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
    // Optional: organize by folder name
    formData.append("folder", folder);

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const json = await res.json();
    return json.secure_url || json.url || null;
  }

  async function uploadFileIfPresent(fileInput, folder) {
    const file = fileInput.files[0];
    if (!file) return null;
    return uploadFileToCloudinary(file, folder);
  }

  async function uploadMultipleFilesIfPresent(fileInput, folder) {
    if (!fileInput || !fileInput.files || !fileInput.files.length) return [];
    const urls = [];
    for (const file of fileInput.files) {
      const url = await uploadFileToCloudinary(file, folder);
      if (url) urls.push(url);
    }
    return urls;
  }

  async function uploadChudiGalleryIfPresent() {
    const gallery = [];
    for (const input of chudiGalleryInputs) {
      const file = input.files[0];
      if (!file) continue;
      const url = await uploadFileToCloudinary(file, "chudithar-gallery");
      if (url) {
        const label = input.dataset.label || "view";
        gallery.push({ label, url });
      }
    }
    return gallery;
  }

  // ===== Materials management =====

  function setMaterialStatus(text) {
    if (materialStatusEl) materialStatusEl.textContent = text || "";
  }

  function resetMaterialForm() {
    if (!materialForm) return;
    materialIdInput.value = "";
    materialNameInput.value = "";
    if (materialFabricSelect) materialFabricSelect.value = "cotton";
    materialBasePriceInput.value = "";
    materialTextureDescInput.value = "";
    if (materialImageInput) materialImageInput.value = "";
    setMaterialStatus("");
  }

  function populateMaterialFormFromDoc(id, data) {
    materialIdInput.value = id;
    materialNameInput.value = data.name || "";
    if (materialFabricSelect && data.fabricType) {
      materialFabricSelect.value = data.fabricType;
    }
    materialBasePriceInput.value = data.basePrice || data.price || "";
    materialTextureDescInput.value = data.textureDescription || "";
    setMaterialStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createMaterialCard(doc) {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "admin-design-card";

    const header = document.createElement("div");
    header.className = "admin-design-card-header";

    const title = document.createElement("strong");
    title.textContent = data.name || "Material";

    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = data.fabricType || "";

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement("div");
    const base = Number(data.basePrice || data.price || 0);
    meta.textContent = base ? `Base price: ₹${base}` : "Base price: On request";

    const actions = document.createElement("div");
    actions.className = "admin-design-card-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => populateMaterialFormFromDoc(doc.id, data));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn secondary";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this material permanently?")) return;
      try {
        await db.collection("materials").doc(doc.id).delete();
        loadMaterialsAdmin();
      } catch (e) {
        console.error("Failed to delete material", e);
        alert("Could not delete material.");
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actions);

    return card;
  }

  function loadMaterialsAdmin() {
    if (!materialsListContainer) return;
    materialsListContainer.textContent = "Loading materials...";

    db.collection("materials")
      .orderBy("name")
      .get()
      .then((snapshot) => {
        materialsAllDocs = snapshot.docs;
        materialsCurrentPage = 0;
        renderMaterialsPage();
      })
      .catch((err) => {
        console.error("Failed to load materials", err);
        materialsListContainer.textContent = "Could not load materials.";
      });
  }

  function renderMaterialsPage() {
    if (!materialsListContainer) return;

    materialsListContainer.innerHTML = "";
    if (!materialsAllDocs.length) {
      materialsListContainer.textContent = "No materials yet.";
      if (materialsPageInfoEl) materialsPageInfoEl.textContent = "Page 0 of 0";
      if (materialsPrevBtn) materialsPrevBtn.disabled = true;
      if (materialsNextBtn) materialsNextBtn.disabled = true;
      return;
    }

    const totalPages = Math.ceil(materialsAllDocs.length / MATERIALS_PAGE_SIZE);
    if (materialsCurrentPage < 0) materialsCurrentPage = 0;
    if (materialsCurrentPage >= totalPages) materialsCurrentPage = totalPages - 1;

    const start = materialsCurrentPage * MATERIALS_PAGE_SIZE;
    const end = start + MATERIALS_PAGE_SIZE;
    const pageDocs = materialsAllDocs.slice(start, end);

    pageDocs.forEach((doc) => {
      const card = createMaterialCard(doc);
      materialsListContainer.appendChild(card);
    });

    if (materialsPageInfoEl) {
      materialsPageInfoEl.textContent = `Page ${materialsCurrentPage + 1} of ${totalPages}`;
    }
    if (materialsPrevBtn) {
      materialsPrevBtn.disabled = materialsCurrentPage === 0;
    }
    if (materialsNextBtn) {
      materialsNextBtn.disabled = materialsCurrentPage >= totalPages - 1;
    }
  }

  if (materialForm) {
    materialForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        setMaterialStatus("Saving material...");

        const basePrice = Number(materialBasePriceInput.value || 0);
        const data = {
          name: materialNameInput.value.trim(),
          fabricType: materialFabricSelect.value,
          basePrice,
          textureDescription: materialTextureDescInput.value.trim(),
        };

        let docRef;
        const existingId = materialIdInput.value || null;
        if (existingId) {
          docRef = db.collection("materials").doc(existingId);
          await docRef.set(data, { merge: true });
        } else {
          docRef = await db.collection("materials").add(data);
        }

        // Optional multiple image upload
        const imageUrls = await uploadMultipleFilesIfPresent(materialImageInput, "materials");
        if (imageUrls && imageUrls.length) {
          const patch = {
            imageUrl: imageUrls[0],
            imageGallery: imageUrls,
          };
          await docRef.set(patch, { merge: true });
        }

        setMaterialStatus("Material saved.");
        resetMaterialForm();
        loadMaterialsAdmin();
      } catch (e) {
        console.error("Failed to save material", e);
        setMaterialStatus("Failed to save material. Check console.");
      }
    });
  }

  if (materialResetBtn) {
    materialResetBtn.addEventListener("click", () => {
      resetMaterialForm();
    });
  }

  if (materialsPrevBtn) {
    materialsPrevBtn.addEventListener("click", () => {
      materialsCurrentPage -= 1;
      renderMaterialsPage();
    });
  }

  if (materialsNextBtn) {
    materialsNextBtn.addEventListener("click", () => {
      materialsCurrentPage += 1;
      renderMaterialsPage();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      setFormStatus("Saving design...");

      const productType = typeSelect.value === "chudithar" ? "chudithar" : "embroidery";
      const collectionName =
        collectionInput.value ||
        (productType === "chudithar" ? "chudithars" : "embroideryDesigns");

      const designData = {
        name: nameInput.value.trim(),
        category: categorySelect.value,
        price: Number(priceInput.value) || 0,
        description: descInput.value.trim(),
      };

      if (productType === "embroidery") {
        designData.placementOptions = getPlacementOptions();
      } else {
        designData.placementOptions = [];
      }

      let docRef;
      const existingId = idInput.value || null;

      if (existingId) {
        docRef = db.collection(collectionName).doc(existingId);
        await docRef.set(designData, { merge: true });
      } else {
        docRef = await db.collection(collectionName).add(designData);
        collectionInput.value = collectionName;
      }

      const imageUrl = await uploadFileIfPresent(imageInput, "design-images");
      const productIsEmbroidery = productType === "embroidery";
      const arTextureUrl = productIsEmbroidery
        ? await uploadFileIfPresent(arTextureInput, "design-textures")
        : null;

      let chudiGallery = [];
      if (!productIsEmbroidery) {
        chudiGallery = await uploadChudiGalleryIfPresent();
      }

      const extra = {};
      if (imageUrl) extra.imageUrl = imageUrl;
      if (arTextureUrl) extra.arTextureUrl = arTextureUrl;
      if (chudiGallery.length) extra.gallery = chudiGallery;

      if (Object.keys(extra).length) {
        await docRef.set(extra, { merge: true });
      }

      setFormStatus("Saved successfully.");
      resetForm();
      loadDesigns();
    } catch (err) {
      console.error("Failed to save design", err);
      setFormStatus("Failed to save design. Check console for details.");
    }
  });

  resetBtn.addEventListener("click", () => {
    resetForm();
  });

  function populateFormFromDoc(id, data, collectionName) {
    idInput.value = id;
    collectionInput.value = collectionName;
    const isEmbroidery = collectionName === "embroideryDesigns";
    typeSelect.value = isEmbroidery ? "embroidery" : "chudithar";
    nameInput.value = data.name || "";
    categorySelect.value = data.category || "neck";
    priceInput.value = data.price || "";
    descInput.value = data.description || "";
    setPlacementOptions(isEmbroidery ? data.placementOptions || [] : []);
    updateTypeSpecificFields();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createListCard(doc, collectionName) {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "admin-design-card";

    const header = document.createElement("div");
    header.className = "admin-design-card-header";

    const title = document.createElement("strong");
    title.textContent = data.name || "Untitled";

    const badge = document.createElement("span");
    badge.className = "admin-badge";
    const isEmbroidery = collectionName === "embroideryDesigns";
    badge.textContent = isEmbroidery ? data.category || "Embroidery" : "Chudithar";

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement("div");
    meta.textContent = data.price ? `₹ ${data.price}` : "Price on request";

    const actions = document.createElement("div");
    actions.className = "admin-design-card-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn secondary";
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () =>
      populateFormFromDoc(doc.id, data, collectionName)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn secondary";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this design permanently?")) return;
      try {
        await db.collection(collectionName).doc(doc.id).delete();
        loadDesigns();
      } catch (err) {
        console.error("Failed to delete design", err);
        alert("Could not delete design.");
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actions);

    return card;
  }

  function loadDesigns() {
    if (!listContainer) return;
    listContainer.innerHTML = "Loading designs...";

    const collections = ["embroideryDesigns", "chudithars"];
    Promise.all(
      collections.map((name) =>
        db
          .collection(name)
          .orderBy("name")
          .get()
          .then((snapshot) => ({ name, snapshot }))
      )
    )
      .then((results) => {
        listContainer.innerHTML = "";
        let hasAny = false;
        results.forEach(({ name, snapshot }) => {
          if (snapshot.empty) return;
          hasAny = true;
          snapshot.forEach((doc) => {
            const card = createListCard(doc, name);
            listContainer.appendChild(card);
          });
        });
        if (!hasAny) {
          listContainer.textContent = "No items added yet.";
        }
      })
      .catch((err) => {
        console.error("Failed to load designs", err);
        listContainer.textContent = "Could not load designs.";
      });
  }

  function createOrderCard(doc) {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "admin-design-card";

    const header = document.createElement("div");
    header.className = "admin-design-card-header";

    const title = document.createElement("strong");
    title.textContent = data.customerName || "Order";

    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = data.orderStatus || "Received";

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement("div");
    const material = data.materialName || "";
    const neck =
      data.neckType === "custom" && data.neckCustomText
        ? `Custom: ${data.neckCustomText}`
        : data.neckType || "";
    const sleeve =
      data.sleeveType === "custom" && data.sleeveCustomText
        ? `Custom: ${data.sleeveCustomText}`
        : data.sleeveType || "";
    const total = data.totalPrice ? `Total: ₹${Math.round(data.totalPrice).toLocaleString()}` : "";
    const paymentStatus = data.paymentStatus || "Pending";
    meta.textContent =
      `${material} | Neck: ${neck} | Sleeve: ${sleeve}` +
      (total ? ` | ${total}` : "") +
      ` | Payment: ${paymentStatus}`;

    const actions = document.createElement("div");
    actions.className = "admin-design-card-actions";

    const phoneBtn = document.createElement("a");
    phoneBtn.className = "btn secondary";
    phoneBtn.textContent = "Call";
    if (data.phone) {
      phoneBtn.href = `tel:${data.phone}`;
    } else {
      phoneBtn.href = "#";
    }

    const statusSelect = document.createElement("select");
    ["Received", "In Stitching", "Ready for Pickup", "Completed"].forEach((status) => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      if (data.orderStatus === status) opt.selected = true;
      statusSelect.appendChild(opt);
    });

    const paymentSelect = document.createElement("select");
    ["Pending", "Received"].forEach((status) => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      if ((data.paymentStatus || "Pending") === status) opt.selected = true;
      paymentSelect.appendChild(opt);
    });

    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.className = "btn secondary";
    updateBtn.textContent = "Update";
    updateBtn.addEventListener("click", async () => {
      try {
        await db
          .collection("orders")
          .doc(doc.id)
          .set(
            { orderStatus: statusSelect.value, paymentStatus: paymentSelect.value },
            { merge: true }
          );
        badge.textContent = statusSelect.value;
        meta.textContent =
          `${material} | Neck: ${neck} | Sleeve: ${sleeve}` +
          (total ? ` | ${total}` : "") +
          ` | Payment: ${paymentSelect.value}`;
      } catch (e) {
        console.error("Failed to update order status", e);
        alert("Could not update order status.");
      }
    });

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn secondary";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", () => {
      showOrderDetails(doc);
    });

    actions.appendChild(phoneBtn);
    actions.appendChild(statusSelect);
    actions.appendChild(updateBtn);
    actions.appendChild(viewBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actions);

    return card;
  }

  function formatDateTime(timestamp) {
    if (!timestamp || !timestamp.toDate) return "-";
    try {
      const d = timestamp.toDate();
      return d.toLocaleString();
    } catch (e) {
      return "-";
    }
  }

  function renderOrderDetailContent(orderId, data, materialData, embroideryData) {
    if (!orderDetailBody) return;

    const measurements = data.measurements || {};
    const embroideryItems = Array.isArray(data.embroideryItems) ? data.embroideryItems : [];

    const materialImage =
      (materialData && (materialData.imageUrl || (materialData.imageGallery && materialData.imageGallery[0]))) ||
      "";
    const embroideryImage =
      (embroideryData && (embroideryData.previewImageUrl || embroideryData.imageUrl)) || "";

    const parts = [];

    parts.push(
      `<div class="order-detail-meta">Order ID: <span>${orderId}</span> · Placed: <span>${formatDateTime(
        data.timestamp
      )}</span></div>`
    );

    parts.push(
      '<div class="order-detail-section">' +
        '<div class="order-detail-section-title">Customer</div>' +
        `<div class="order-detail-row">Name: <strong>${data.customerName || "-"}</strong></div>` +
        `<div class="order-detail-row">Phone: <strong>${data.phone || "-"}</strong></div>` +
      "</div>"
    );

    parts.push(
      '<div class="order-detail-section">' +
        '<div class="order-detail-section-title">Material</div>' +
        `<div class="order-detail-row">${data.materialName || "-"} (${data.materialFabric || ""})</div>` +
        `<div class="order-detail-row">Material price: ₹${Number(data.materialPrice || 0)}</div>` +
      "</div>"
    );

    const neckDisplay =
      data.neckType === "custom" && data.neckCustomText
        ? `Custom: ${data.neckCustomText}`
        : data.neckType || "-";
    const sleeveDisplay =
      data.sleeveType === "custom" && data.sleeveCustomText
        ? `Custom: ${data.sleeveCustomText}`
        : data.sleeveType || "-";
    const pantDisplay =
      data.pantStyle === "custom" && data.pantCustomText
        ? `Custom: ${data.pantCustomText}`
        : data.pantStyle || "-";

    parts.push(
      '<div class="order-detail-section">' +
        '<div class="order-detail-section-title">Stitching Style</div>' +
        `<div class="order-detail-row">Neck: ${neckDisplay}</div>` +
        `<div class="order-detail-row">Sleeve: ${sleeveDisplay}</div>` +
        `<div class="order-detail-row">Pant style: ${pantDisplay}</div>` +
        `<div class="order-detail-row">Top length (style): ${data.topLength || "-"}</div>` +
        `<div class="order-detail-row">Bottom length: ${data.bottomLength || "-"}</div>` +
      "</div>"
    );

    parts.push(
      '<div class="order-detail-section">' +
        '<div class="order-detail-section-title">Measurements</div>' +
        `<div class="order-detail-row">Chest: ${measurements.chest || "-"}, Waist: ${
          measurements.waist || "-"
        }, Hip: ${measurements.hip || "-"}</div>` +
        `<div class="order-detail-row">Shoulder width: ${measurements.shoulderWidth || "-"}</div>` +
        `<div class="order-detail-row">Sleeve length: ${measurements.sleeveLength || "-"}</div>` +
        `<div class="order-detail-row">Top length: ${measurements.topLength || "-"}</div>` +
        `<div class="order-detail-row">Front neck depth: ${measurements.frontNeckDepth || "-"}</div>` +
        `<div class="order-detail-row">Back neck depth: ${measurements.backNeckDepth || "-"}</div>` +
      "</div>"
    );

    if (embroideryItems.length) {
      parts.push(
        '<div class="order-detail-section">' +
          '<div class="order-detail-section-title">Embroidery</div>' +
          embroideryItems
            .map((item, idx) => {
              const name = item.name || data.embroideryDesignName || "Embroidery design";
              const placement = item.placement || "-";
              const notes = item.notes || data.embroideryDesignNotes || data.customDesignNotes || "-";
              const price = item.price ? ` · ${Number(item.price)}` : "";
              return `<div class="order-detail-row">${idx + 1}) ${name} (${placement}${price}) - ${notes}</div>`;
            })
            .join("") +
        "</div>"
      );
    } else {
      const placement = Array.isArray(data.placement) ? data.placement.join(", ") : data.placement || "-";

      parts.push(
        '<div class="order-detail-section">' +
          '<div class="order-detail-section-title">Embroidery</div>' +
          `<div class="order-detail-row">Design: ${data.embroideryDesignName || "-"}</div>` +
          `<div class="order-detail-row">Placement: ${placement}</div>` +
          `<div class="order-detail-row">Embroidery notes: ${
            data.embroideryDesignNotes || data.customDesignNotes || "-"
          }</div>` +
        "</div>"
      );
    }

    parts.push(
      '<div class="order-detail-section">' +
        '<div class="order-detail-section-title">Pricing</div>' +
        `<div class="order-detail-row">Stitching charge: ₹${Number(data.stitchingCharge || 0)}</div>` +
        `<div class="order-detail-row">Embroidery price: ₹${Number(data.embroideryPrice || 0)}</div>` +
        `<div class="order-detail-row"><strong>Total: ₹${Number(data.totalPrice || 0)}</strong></div>` +
        `<div class="order-detail-row">Advance amount: ₹${Number(data.advanceAmount || 0)}</div>` +
        `<div class="order-detail-row">Payment status: ${data.paymentStatus || "Pending"}</div>` +
      "</div>"
    );

    if (materialImage || embroideryImage || data.customDesignImage || embroideryItems.length) {
      const images = [];
      if (materialImage) {
        images.push(`<div class="order-detail-image-item"><div class="order-detail-image-label">Material</div><img src="${materialImage}" alt="Material image" /></div>`);
      }
      if (embroideryImage) {
        images.push(`<div class="order-detail-image-item"><div class="order-detail-image-label">Embroidery</div><img src="${embroideryImage}" alt="Embroidery design" /></div>`);
      }
      if (embroideryItems.length) {
        embroideryItems.forEach((item, idx) => {
          if (!item.imageUrl) return;
          images.push(
            `<div class="order-detail-image-item"><div class="order-detail-image-label">Embroidery ${
              idx + 1
            }</div><img src="${item.imageUrl}" alt="Embroidery design ${idx + 1}" /></div>`
          );
        });
      }
      if (data.customDesignImage) {
        images.push(`<div class="order-detail-image-item"><div class="order-detail-image-label">Customer design</div><img src="${data.customDesignImage}" alt="Customer custom design" /></div>`);
      }

      parts.push(
        '<div class="order-detail-section">' +
          '<div class="order-detail-section-title">Images</div>' +
          `<div class="order-detail-images">${images.join("")}</div>` +
        "</div>"
      );
    }

    orderDetailBody.innerHTML = parts.join("");
  }

  async function showOrderDetails(doc) {
    if (!orderDetailOverlay || !orderDetailBody) return;

    const data = doc.data();
    orderDetailBody.textContent = "Loading order details...";
    orderDetailOverlay.classList.remove("hidden");
    orderDetailOverlay.setAttribute("aria-hidden", "false");

    let materialData = null;
    let embroideryData = null;

    try {
      if (data.materialId) {
        const mDoc = await db.collection("materials").doc(data.materialId).get();
        if (mDoc.exists) materialData = mDoc.data();
      }
    } catch (e) {
      console.error("Failed to load material for order detail", e);
    }

    try {
      if (data.embroideryDesignID) {
        const eDoc = await db.collection("embroideryDesigns").doc(data.embroideryDesignID).get();
        if (eDoc.exists) embroideryData = eDoc.data();
      }
    } catch (e) {
      console.error("Failed to load embroidery design for order detail", e);
    }

    renderOrderDetailContent(doc.id, data, materialData, embroideryData);
  }

  function loadOrders() {
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = "Loading orders...";

    db.collection("orders")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get()
      .then((snapshot) => {
        ordersListContainer.innerHTML = "";
        if (snapshot.empty) {
          ordersListContainer.textContent = "No orders yet.";
          return;
        }
        snapshot.forEach((doc) => {
          const card = createOrderCard(doc);
          ordersListContainer.appendChild(card);
        });
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
        ordersListContainer.textContent = "Could not load orders.";
      });
  }

  if (orderDetailCloseBtn && orderDetailOverlay) {
    orderDetailCloseBtn.addEventListener("click", () => {
      orderDetailOverlay.classList.add("hidden");
      orderDetailOverlay.setAttribute("aria-hidden", "true");
    });

    orderDetailOverlay.addEventListener("click", (e) => {
      if (e.target === orderDetailOverlay) {
        orderDetailOverlay.classList.add("hidden");
        orderDetailOverlay.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Initialize default form state
  resetForm();
  resetMaterialForm();
})();
