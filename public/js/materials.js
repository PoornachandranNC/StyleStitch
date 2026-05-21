(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; materials catalog will not work.");
    return;
  }

  const gridEl = document.getElementById("materials-grid");
  const resultsCountEl = document.getElementById("materials-results-count");
  const filterCountEl = document.getElementById("materials-filter-count");
  const fabricSelect = document.getElementById("filter-fabric");
  const priceMinSlider = document.getElementById("filter-material-price-min");
  const priceMaxSlider = document.getElementById("filter-material-price-max");
  const priceValueEl = document.getElementById("filter-material-price-value");
  const priceTrackEl = document.getElementById("filter-material-price-track");

  function formatPrice(p) {
    if (!p || p <= 0) return "Price on request";
    return `₹${p}`;
  }

  function updatePriceLabel(changedSlider) {
    if (!priceMinSlider || !priceMaxSlider || !priceValueEl) return;

    let minValue = Number(priceMinSlider.value || 0);
    let maxValue = Number(priceMaxSlider.value || 50000);

    if (minValue > maxValue) {
      if (changedSlider === "min") {
        maxValue = minValue;
      } else {
        minValue = maxValue;
      }
      priceMinSlider.value = String(minValue);
      priceMaxSlider.value = String(maxValue);
    }

    priceValueEl.textContent = `₹${minValue.toLocaleString()} - ₹${maxValue.toLocaleString()}`;

    if (priceTrackEl) {
      const min = Number(priceMinSlider.min || 0);
      const max = Number(priceMinSlider.max || 50000);
      const left = ((minValue - min) / (max - min)) * 100;
      const right = ((maxValue - min) / (max - min)) * 100;
      priceTrackEl.style.background = `linear-gradient(to right, #d5d9d9 ${left}%, #1f67ad ${left}%, #1f67ad ${right}%, #d5d9d9 ${right}%)`;
    }
  }

  function createMaterialCard(material) {
    const card = document.createElement("div");
    card.className = "design-card";

    const imgUrl = material.imageUrl || material.textureUrl || "https://via.placeholder.com/400x300?text=Material";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = material.name || "Material";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "design-card-body";

    const title = document.createElement("h3");
    title.textContent = material.name || "Untitled material";
    body.appendChild(title);

    const fabric = document.createElement("p");
    fabric.className = "detail-meta";
    fabric.textContent = material.fabricType
      ? material.fabricType.charAt(0).toUpperCase() + material.fabricType.slice(1)
      : "";
    body.appendChild(fabric);

    if (material.textureDescription) {
      const desc = document.createElement("p");
      desc.className = "detail-meta";
      desc.textContent = material.textureDescription;
      body.appendChild(desc);
    }

    const priceRow = document.createElement("div");
    priceRow.className = "price-range";
    priceRow.textContent = "";
    const price = Number(material.basePrice || material.price || 0);
    if (price > 0) {
      priceRow.textContent = price.toLocaleString();
    } else {
      priceRow.textContent = "On request";
    }
    body.appendChild(priceRow);

    const actions = document.createElement("div");
    actions.className = "design-card-actions";

    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = "Material";
    actions.appendChild(badge);

    const customizeBtn = document.createElement("a");
    customizeBtn.className = "btn secondary";
    customizeBtn.textContent = "Customize This Material";
    customizeBtn.href = `customize.html?materialId=${encodeURIComponent(material.id)}`;
    actions.appendChild(customizeBtn);

    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function renderMaterials(list) {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No materials found. Try changing the filters.";
      gridEl.appendChild(empty);
      if (resultsCountEl) resultsCountEl.textContent = "0 materials";
      return;
    }

    list.forEach((m) => {
      const card = createMaterialCard(m);
      gridEl.appendChild(card);
    });

    if (resultsCountEl) {
      const label = list.length === 1 ? "material" : "materials";
      resultsCountEl.textContent = `${list.length} ${label}`;
    }
  }

  async function loadMaterials() {
    try {
      if (resultsCountEl) resultsCountEl.textContent = "Loading materials...";

      let query = db.collection("materials");

      const snapshot = await query.get();
      const all = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        all.push({ id: doc.id, ...data });
      });

      const fabricFilter = (fabricSelect && fabricSelect.value) || "all";
      const minPrice = Number(priceMinSlider && priceMinSlider.value) || 0;
      const maxPrice = Number(priceMaxSlider && priceMaxSlider.value) || 50000;

      const filtered = all.filter((m) => {
        if (fabricFilter !== "all" && m.fabricType !== fabricFilter) return false;
        const price = Number(m.basePrice || m.price || 0);
        if (price > 0 && (price < minPrice || price > maxPrice)) return false;
        return true;
      });

      renderMaterials(filtered);

      if (filterCountEl) {
        const label = all.length === 1 ? "material total" : "materials total";
        filterCountEl.textContent = `${all.length} ${label}`;
      }
    } catch (err) {
      console.error("Failed to load materials", err);
      if (resultsCountEl) resultsCountEl.textContent = "Could not load materials";
    }
  }

  if (priceMinSlider && priceMaxSlider && priceValueEl) {
    updatePriceLabel();
    priceMinSlider.addEventListener("input", () => {
      updatePriceLabel("min");
      loadMaterials();
    });
    priceMaxSlider.addEventListener("input", () => {
      updatePriceLabel("max");
      loadMaterials();
    });
  }

  if (fabricSelect) {
    fabricSelect.addEventListener("change", loadMaterials);
  }

  document.addEventListener("DOMContentLoaded", loadMaterials);
})();
