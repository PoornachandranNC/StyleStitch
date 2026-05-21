// Homepage featured designs & full catalog listing

(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase Firestore not initialized yet.");
    return;
  }

  const featuredGrid = document.getElementById("featured-designs-grid");
  const catalogGrid = document.getElementById("catalog-grid");

  // Dual price range slider (min and max)
  const priceMinSlider = document.getElementById("filter-price-min");
  const priceMaxSlider = document.getElementById("filter-price-max");
  const priceValue = document.getElementById("filter-price-value");
  const priceTrack = document.getElementById("filter-price-track");

  function updatePriceRangeUI(changedSlider) {
    if (!priceMinSlider || !priceMaxSlider) return;

    let minVal = Number(priceMinSlider.value || 0);
    let maxVal = Number(priceMaxSlider.value || 50000);

    if (minVal > maxVal) {
      if (changedSlider === "min") {
        maxVal = minVal;
      } else {
        minVal = maxVal;
      }
      priceMinSlider.value = String(minVal);
      priceMaxSlider.value = String(maxVal);
    }

    if (priceValue) {
      priceValue.textContent = `₹${minVal.toLocaleString()} - ₹${maxVal.toLocaleString()}`;
    }

    if (priceTrack) {
      const min = Number(priceMinSlider.min || 0);
      const max = Number(priceMinSlider.max || 50000);
      const left = ((minVal - min) / (max - min)) * 100;
      const right = ((maxVal - min) / (max - min)) * 100;
      priceTrack.style.background = `linear-gradient(to right, #d5d9d9 ${left}%, #1f67ad ${left}%, #1f67ad ${right}%, #d5d9d9 ${right}%)`;
    }
  }

  function createDesignCard(design) {
    const card = document.createElement("article");
    card.className = "design-card";

    const img = document.createElement("img");
    img.src = design.thumbnailUrl || design.imageUrl || "assets/images/placeholder.png";
    img.alt = design.name || "Design";

    const body = document.createElement("div");
    body.className = "design-card-body";

    const title = document.createElement("h3");
    title.textContent = design.name || "Untitled Design";

    const price = document.createElement("div");
    price.className = "price-range";
    if (design.price) {
      price.textContent = design.price;
    } else {
      price.textContent = "Price on request";
      price.style.color = "var(--muted)";
      price.style.fontSize = "0.9rem";
      price.style.fontWeight = "500";
    }

    const actions = document.createElement("div");
    actions.className = "design-card-actions";

    const type = document.createElement("span");
    type.className = "admin-badge";
    if (design.productType === "chudithar") {
      type.textContent = "Chudithar";
    } else {
      type.textContent = design.category || "Embroidery";
    }

    const viewBtn = document.createElement("a");
    const productType = design.productType || "embroidery";
    viewBtn.href = `design.html?id=${design.id}&type=${productType}`;
    viewBtn.className = "btn secondary";
    viewBtn.textContent = "View";

    actions.appendChild(type);
    actions.appendChild(viewBtn);

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);

    return card;
  }

  // Load featured designs for homepage
  if (featuredGrid) {
    db.collection("embroideryDesigns")
      .where("featured", "==", true)
      .limit(6)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          featuredGrid.textContent = "Featured designs will appear here once added.";
          return;
        }
        snapshot.forEach((doc) => {
          const data = doc.data();
          const card = createDesignCard({ id: doc.id, ...data });
          featuredGrid.appendChild(card);
        });
      })
      .catch((err) => {
        console.error("Error loading featured designs", err);
      });
  }

  // Load catalog with simple filtering
  if (catalogGrid) {
    const productTypeSelect = document.getElementById("filter-product-type");
    const resultsCount = document.querySelector(".results-count");

    function updateResultsCount(count) {
      if (resultsCount) {
        resultsCount.textContent = `${count} ${count === 1 ? 'product' : 'products'} found`;
      }
    }

    function renderCatalog(items) {
      catalogGrid.innerHTML = "";
      updateResultsCount(items.length);
      
      if (!items.length) {
        catalogGrid.innerHTML = '<div class="empty-state">No products match your current filters. Try adjusting your selection.</div>';
        return;
      }
      items.forEach((item) => {
        const card = createDesignCard(item);
        catalogGrid.appendChild(card);
      });
    }

    function loadCatalog() {
      const productType = productTypeSelect ? productTypeSelect.value : "all";
      const minPrice = priceMinSlider && priceMinSlider.value ? parseInt(priceMinSlider.value, 10) : 0;
      const maxPrice = priceMaxSlider && priceMaxSlider.value ? parseInt(priceMaxSlider.value, 10) : 50000;
      const embroideryNeeded = productType === "all" || productType === "embroidery";
      const chudiNeeded = productType === "all" || productType === "chudithar";

      const embroideryPromise = embroideryNeeded
        ? (function () {
            let query = db.collection("embroideryDesigns");
            return query.get().then((snapshot) =>
              snapshot.docs
                .map((doc) => ({ id: doc.id, productType: "embroidery", ...doc.data() }))
                .filter((d) => {
                  const price = Number(d.price || 0);
                  if (!price) return true;
                  if (price < minPrice || price > maxPrice) return false;
                  return true;
                })
            );
          })()
        : Promise.resolve([]);

      const chudiPromise = chudiNeeded
        ? db
            .collection("chudithars")
            .get()
            .then((snapshot) =>
              snapshot.docs
                .map((doc) => ({ id: doc.id, productType: "chudithar", ...doc.data() }))
                .filter((d) => {
                  const price = Number(d.price || 0);
                  if (!price) return true;
                  if (price < minPrice || price > maxPrice) return false;
                  return true;
                })
            )
        : Promise.resolve([]);

      Promise.all([embroideryPromise, chudiPromise])
        .then(([embroideryItems, chudiItems]) => {
          renderCatalog([...embroideryItems, ...chudiItems]);
        })
        .catch((err) => {
          console.error("Error loading catalog", err);
          catalogGrid.textContent = "Could not load catalog. Please try again later.";
        });
    }
    if (productTypeSelect) {
      productTypeSelect.addEventListener("change", loadCatalog);
    }
    if (priceMinSlider) {
      priceMinSlider.addEventListener("input", () => {
        updatePriceRangeUI("min");
        loadCatalog();
      });
    }
    if (priceMaxSlider) {
      priceMaxSlider.addEventListener("input", () => {
        updatePriceRangeUI("max");
        loadCatalog();
      });
    }

    updatePriceRangeUI();

    loadCatalog();
  }
})();
