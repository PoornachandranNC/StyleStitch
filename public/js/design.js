// Design detail page logic

(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase Firestore not initialized yet.");
    return;
  }

  const container = document.getElementById("design-detail");
  if (!container) return;

  const designId = window.getQueryParam("id");
  const productTypeParam = window.getQueryParam("type") || "embroidery";
  const collectionName =
    productTypeParam === "chudithar" ? "chudithars" : "embroideryDesigns";
  if (!designId) {
    container.textContent = "Design not found. Please go back to the catalog.";
    return;
  }

  const isOnMobile = window.isMobile && window.isMobile();
  const qrSection = document.getElementById("qr-section");

  function buildWhatsAppLink(design) {
    const phone = "0000000000"; // TODO: replace with real shop WhatsApp number
    const base = `https://wa.me/${phone}`;
    const text = encodeURIComponent(
      `Hello, I am interested in this ${
        productTypeParam === "chudithar" ? "chudithar" : "embroidery"
      } design:\n\n` +
        `Name: ${design.name}\n` +
        (design.category ? `Category: ${design.category}\n` : "") +
        (design.price ? `Price: ₹ ${design.price}\n` : "") +
        `Design ID: ${design.id}\n\n` +
        "Can you please share more details?"
    );
    return `${base}?text=${text}`;
  }

  function buildArUrl(design) {
    const origin = window.location.origin;
    return `${origin}/ar.html?id=${design.id}`;
  }

  function renderDesign(design) {
    container.innerHTML = "";

    const wrapperImage = document.createElement("div");
    wrapperImage.className = "design-detail-image";

    const image = document.createElement("img");
    image.src = design.imageUrl || design.thumbnailUrl || "assets/images/placeholder.png";
    image.alt = design.name || "Embroidery design";

    wrapperImage.appendChild(image);

    // Optional gallery for multi-view items (e.g., chudithars)
    const hasGallery = Array.isArray(design.gallery) && design.gallery.length;
    let galleryContainer = null;
    if (hasGallery) {
      galleryContainer = document.createElement("div");
      galleryContainer.className = "design-gallery";
      design.gallery.forEach((g) => {
        if (!g || !g.url) return;
        const thumb = document.createElement("img");
        thumb.src = g.url;
        thumb.alt = g.label || "View";
        thumb.addEventListener("click", () => {
          image.src = g.url;
        });
        galleryContainer.appendChild(thumb);
      });
      wrapperImage.appendChild(galleryContainer);
    }

    const info = document.createElement("div");
    info.className = "design-detail-info";

    const title = document.createElement("h1");
    title.textContent = design.name || "Embroidery Design";

    const desc = document.createElement("p");
    desc.textContent = design.description || "Detailed description will appear here.";

    const price = document.createElement("p");
    price.className = "detail-meta";
    if (design.price) {
      price.textContent = `Price: ₹ ${design.price}`;
    } else {
      price.textContent = "Price: On request";
    }

    const placementTitle = document.createElement("p");
    placementTitle.className = "detail-meta";
    placementTitle.textContent = "Placement options:";

    const placementList = document.createElement("ul");
    placementList.className = "placement-list";
    (design.placementOptions || []).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      placementList.appendChild(li);
    });

    const actions = document.createElement("div");
    actions.className = "detail-actions";

    const waBtn = document.createElement("a");
    waBtn.className = "btn secondary";
    waBtn.href = buildWhatsAppLink(design);
    waBtn.target = "_blank";
    waBtn.textContent = "Send via WhatsApp";

    if (productTypeParam !== "chudithar") {
      const arBtn = document.createElement("a");
      arBtn.className = "btn primary";

      if (isOnMobile) {
        arBtn.href = buildArUrl(design);
        arBtn.textContent = "Preview in AR";
      } else {
        arBtn.href = "#";
        arBtn.textContent = "Preview in AR on mobile";
        arBtn.addEventListener("click", (e) => {
          e.preventDefault();
          if (!qrSection) return;
          qrSection.hidden = false;
          renderQrCode(buildArUrl(design));
        });
      }

      actions.appendChild(arBtn);
    }
    actions.appendChild(waBtn);

    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(price);

    if (design.placementOptions && design.placementOptions.length) {
      info.appendChild(placementTitle);
      info.appendChild(placementList);
    }

    info.appendChild(actions);

    container.appendChild(wrapperImage);
    container.appendChild(info);
  }

  function renderQrCode(url) {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 220;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#999";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR code placeholder", size / 2, size / 2);
    ctx.fillText("(use real QR lib)", size / 2, size / 2 + 18);
    console.log("Open this URL on mobile for AR:", url);
  }

  db.collection(collectionName)
    .doc(designId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        container.textContent = "Design not found. It may have been removed.";
        return;
      }
      const data = doc.data();
      renderDesign({ id: doc.id, ...data });
    })
    .catch((err) => {
      console.error("Error loading design", err);
      container.textContent = "Unable to load design details at the moment.";
    });
})();
