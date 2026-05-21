(function () {
  if (typeof db === "undefined") {
    console.warn("Firebase not initialized; my orders page will not work.");
    return;
  }

  const ordersListEl = document.getElementById("orders-list");
  const ordersStatusEl = document.getElementById("orders-status");
   const toggleOrdersBtn = document.getElementById("toggle-orders");
   const toggleCartBtn = document.getElementById("toggle-cart");

  let currentView = "orders"; // "orders" | "cart"

  function setStatus(msg) {
    if (ordersStatusEl) ordersStatusEl.textContent = msg || "";
  }

  function renderEmpty() {
    if (!ordersListEl) return;
    ordersListEl.innerHTML = "<p class='detail-meta'>No orders found for this phone number yet.</p>";
  }

  function formatPrice(p) {
    if (!p || p <= 0) return "₹0";
    return "₹" + Math.round(p).toLocaleString();
  }

  function formatDate(ts) {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : ts;
    return d.toLocaleString();
  }

  function getPhoneFilter() {
    const fromQuery = window.getQueryParam ? window.getQueryParam("phone") : null;
    if (fromQuery) return fromQuery;
    if (window.getCustomerSession) {
      const session = window.getCustomerSession();
      if (session && session.phone) return session.phone;
    }
    return null;
  }

  function createOrderCard(doc) {
    const data = doc.data();
    const wrapper = document.createElement("article");
    wrapper.className = "admin-design-card";

    const header = document.createElement("div");
    header.className = "admin-design-card-header";

    const title = document.createElement("div");
    title.innerHTML = `<strong>Order</strong> - ${data.customerName || "Customer"}`;

    const status = document.createElement("span");
    status.className = "admin-badge";
    status.textContent = data.orderStatus || "Received";

    header.appendChild(title);
    header.appendChild(status);

    const body = document.createElement("div");
    body.style.marginTop = "0.5rem";
    body.style.fontSize = "0.86rem";
    const materialLine = data.materialName
      ? `${data.materialName} ${data.materialFabric ? `(${data.materialFabric})` : ""}`
      : "Material: -";

    const placement = Array.isArray(data.placement) ? data.placement.join(", ") : "-";

    const embroideryLine = data.embroideryDesignName
      ? `${data.embroideryDesignName} (${placement || "Placement: -"})`
      : "Embroidery: None";

    const embNotes = data.embroideryDesignNotes || data.customDesignNotes || "-";

    body.innerHTML = `
      <p><strong>Material:</strong> ${materialLine}</p>
      <p><strong>Embroidery:</strong> ${embroideryLine}</p>
      <p><strong>Embroidery notes:</strong> ${embNotes}</p>
      <p><strong>Total price:</strong> ${formatPrice(data.totalPrice)} &nbsp; | &nbsp; <strong>Advance (~40%):</strong> ${formatPrice(data.advanceAmount)}</p>
      <p><strong>Phone:</strong> ${data.phone || "-"}</p>
      <p><strong>Created:</strong> ${formatDate(data.timestamp)}</p>
    `;

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    return wrapper;
  }

  function createCartCard(doc) {
    const data = doc.data();
    const wrapper = document.createElement("article");
    wrapper.className = "admin-design-card";

    const header = document.createElement("div");
    header.className = "admin-design-card-header";

    const title = document.createElement("div");
    title.innerHTML = `<strong>Cart item</strong> - ${data.customerName || "Customer"}`;

    const status = document.createElement("span");
    status.className = "admin-badge";
    status.textContent = data.cartStatus || "In Cart";

    header.appendChild(title);
    header.appendChild(status);

    const body = document.createElement("div");
    body.style.marginTop = "0.5rem";
    body.style.fontSize = "0.86rem";
    const materialLine = data.materialName
      ? `${data.materialName} ${data.materialFabric ? `(${data.materialFabric})` : ""}`
      : "Material: -";

    const placement = Array.isArray(data.placement) ? data.placement.join(", ") : "-";

    const embroideryLine = data.embroideryDesignName
      ? `${data.embroideryDesignName} (${placement || "Placement: -"})`
      : "Embroidery: None";

    const embNotes = data.embroideryDesignNotes || data.customDesignNotes || "-";

    body.innerHTML = `
      <p><strong>Material:</strong> ${materialLine}</p>
      <p><strong>Embroidery:</strong> ${embroideryLine}</p>
      <p><strong>Embroidery notes:</strong> ${embNotes}</p>
      <p><strong>Total price:</strong> ${formatPrice(data.totalPrice)} &nbsp; | &nbsp; <strong>Advance (~40%):</strong> ${formatPrice(data.advanceAmount)}</p>
      <p><strong>Phone:</strong> ${data.phone || "-"}</p>
      <p><strong>Saved:</strong> ${formatDate(data.timestamp)}</p>
    `;

    const actions = document.createElement("div");
    actions.className = "wizard-actions detail-actions";

    const placeBtn = document.createElement("button");
    placeBtn.type = "button";
    placeBtn.className = "btn primary";
    placeBtn.textContent = "Place this dress now";
    placeBtn.addEventListener("click", async () => {
      try {
        ordersStatusEl.textContent = "Placing order from cart...";
        const cartData = doc.data();
        const orderDoc = {
          customerName: cartData.customerName,
          phone: cartData.phone,
          materialId: cartData.materialId || "",
          materialName: cartData.materialName || "",
          materialFabric: cartData.materialFabric || "",
          materialPrice: cartData.materialPrice || 0,
          neckType: cartData.neckType || "",
          sleeveType: cartData.sleeveType || "",
          neckCustomText: cartData.neckCustomText || "",
          sleeveCustomText: cartData.sleeveCustomText || "",
          topLength: cartData.topLength || "",
          sleeveLength: cartData.sleeveLength || "",
          pantStyle: cartData.pantStyle || "",
          pantCustomText: cartData.pantCustomText || "",
          bottomLength: cartData.bottomLength || "",
          embroideryItems: Array.isArray(cartData.embroideryItems) ? cartData.embroideryItems : [],
          embroideryDesignID: cartData.embroideryDesignID || "",
          embroideryDesignName: cartData.embroideryDesignName || "",
          placement: Array.isArray(cartData.placement) ? cartData.placement : [],
          measurements: cartData.measurements || {},
          embroideryDesignNotes: cartData.embroideryDesignNotes || "",
          customDesignImage: cartData.customDesignImage || "",
          customDesignNotes: cartData.customDesignNotes || "",
          stitchingCharge: cartData.stitchingCharge || 0,
          embroideryPrice: cartData.embroideryPrice || 0,
          totalPrice: cartData.totalPrice || 0,
          advanceAmount: cartData.advanceAmount || 0,
          paymentStatus: "Pending",
          orderStatus: "Received",
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Single-dress order stored as one item in orderItems array
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

        await db.collection("orders").add(orderDoc);
        await db.collection("carts").doc(doc.id).delete();
        ordersStatusEl.textContent = "Order placed from cart. You can see it under Placed orders.";
        loadCartItems();
      } catch (e) {
        console.error("Failed to place order from cart", e);
        ordersStatusEl.textContent = "Could not place order from cart. Please try again.";
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn secondary";
    deleteBtn.textContent = "Remove from cart";
    deleteBtn.addEventListener("click", async () => {
      try {
        ordersStatusEl.textContent = "Removing dress from cart...";
        await db.collection("carts").doc(doc.id).delete();
        ordersStatusEl.textContent = "Dress removed from cart.";
        loadCartItems();
      } catch (e) {
        console.error("Failed to remove cart item", e);
        ordersStatusEl.textContent = "Could not remove from cart. Please try again.";
      }
    });

    actions.appendChild(placeBtn);
    actions.appendChild(deleteBtn);
    body.appendChild(actions);

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    return wrapper;
  }

  async function loadPlacedOrders() {
    const phone = getPhoneFilter();
    if (!phone) {
      setStatus("Could not determine your phone number to load orders.");
      renderEmpty();
      return;
    }

    setStatus("Loading your orders...");

    try {
      const snapshot = await db
        .collection("orders")
        .where("phone", "==", phone)
        .get();
      if (snapshot.empty) {
        setStatus("No orders found.");
        renderEmpty();
        return;
      }

      if (!ordersListEl) return;
      ordersListEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const card = createOrderCard(doc);
        ordersListEl.appendChild(card);
      });
      setStatus("");
    } catch (e) {
      console.error("Failed to load orders", e);
      setStatus("Could not load orders. Please try again.");
    }
  }

  async function loadCartItems() {
    const phone = getPhoneFilter();
    if (!phone) {
      setStatus("Could not determine your phone number to load cart.");
      renderEmpty();
      return;
    }

    setStatus("Loading your cart items...");

    try {
      const snapshot = await db
        .collection("carts")
        .where("phone", "==", phone)
        .get();
      if (snapshot.empty) {
        setStatus("No saved dresses in cart.");
        renderEmpty();
        return;
      }

      if (!ordersListEl) return;
      ordersListEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const card = createCartCard(doc);
        ordersListEl.appendChild(card);
      });
      setStatus("");
    } catch (e) {
      console.error("Failed to load cart items", e);
      setStatus("Could not load cart items. Please try again.");
    }
  }

  function wireToggles() {
    if (toggleOrdersBtn) {
      toggleOrdersBtn.addEventListener("click", () => {
        currentView = "orders";
        toggleOrdersBtn.classList.add("primary");
        toggleOrdersBtn.classList.remove("secondary");
        if (toggleCartBtn) {
          toggleCartBtn.classList.add("secondary");
          toggleCartBtn.classList.remove("primary");
        }
        loadPlacedOrders();
      });
    }
    if (toggleCartBtn) {
      toggleCartBtn.addEventListener("click", () => {
        currentView = "cart";
        toggleCartBtn.classList.add("primary");
        toggleCartBtn.classList.remove("secondary");
        if (toggleOrdersBtn) {
          toggleOrdersBtn.classList.add("secondary");
          toggleOrdersBtn.classList.remove("primary");
        }
        loadCartItems();
      });
    }

    // default view
    if (toggleOrdersBtn) {
      toggleOrdersBtn.classList.add("primary");
      toggleOrdersBtn.classList.remove("secondary");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireToggles();
    loadPlacedOrders();
  });
})();
