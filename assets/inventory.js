// ================== REFERENCIAS ==================
const form = document.getElementById("productForm");
const cancelEditBtn = document.getElementById("cancelEdit");
const searchInput = document.getElementById("search");
const countEl = document.getElementById("count");
const catalogo = document.getElementById("catalogo");

// Campos del formulario principal
const skuInput = form.elements["sku"];
const nameInput = form.elements["name"];
const imageInput = form.elements["image"];
const priceInput = form.elements["price"];
const stockInput = form.elements["stock"];
const idInput = form.elements["id"];

// Popup referencias
const productPopup = document.getElementById("productPopup");
const popupForm = document.getElementById("productPopupForm");
const popupCloseBtn = document.getElementById("closeProductPopup");
const cancelPopupBtn = document.getElementById("cancelProductEdit");
const popupSku = popupForm.elements["sku"];
const popupName = popupForm.elements["name"];
const popupImage = popupForm.elements["image"];
const popupPrice = popupForm.elements["price"];
const popupStock = popupForm.elements["stock"];
const popupId = popupForm.elements["id"];
const currentImageDiv = document.getElementById("currentImage");
const currentImg = currentImageDiv.querySelector("img");

// Clave única en localStorage
let products = JSON.parse(localStorage.getItem("products")) || [];

// ================== GUARDAR O ACTUALIZAR PRODUCTO PRINCIPAL ==================
form.addEventListener("submit", e => {
  e.preventDefault();
  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = ev => saveProduct(ev.target.result);
    reader.readAsDataURL(file);
  } else {
    let existing = null;
    if (idInput.value) {
      existing = products.find(p => p.id == idInput.value);
    }
    saveProduct(existing ? existing.image : "");
  }
});

function saveProduct(imageBase64) {
  const producto = {
    id: idInput.value || Date.now(),
    sku: skuInput.value.trim(),
    name: nameInput.value.trim(),
    image: imageBase64,
    price: parseFloat(priceInput.value) || 0,
    stock: parseInt(stockInput.value) || 0
  };

  if (!producto.sku || !producto.name || producto.price <= 0 || producto.stock < 0) {
    alert("Completa todos los campos correctamente y asegúrate que precio > 0 y stock >= 0");
    return;
  }

  if (idInput.value) {
    products = products.map(p => p.id == idInput.value ? producto : p);
    idInput.value = "";
    cancelEditBtn.style.display = "none";
  } else {
    if (products.some(p => p.sku === producto.sku)) {
      alert("Ya existe un producto con ese SKU");
      return;
    }
    products.push(producto);
  }

  localStorage.setItem("products", JSON.stringify(products));
  form.reset();
  renderCatalogo(searchInput.value);
}

// ================== RENDERIZAR CATÁLOGO ==================
function renderCatalogo(filtro = "") {
  catalogo.innerHTML = "";

  const filtrados = products.filter(p =>
    p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
    p.name.toLowerCase().includes(filtro.toLowerCase())
  );

  filtrados.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${prod.image 
        ? `<img src="${prod.image}" alt="${prod.name}">` 
        : `<div style="width:100%;height:120px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af">Sin imagen</div>`}
      <div class="name">${prod.name}</div>
      <div class="price">$${prod.price.toFixed(2)}</div>
      <div style="margin-top:8px">
        <button class="btn secondary" data-id="${prod.id}" data-action="edit">Editar</button>
        <button class="btn danger" data-id="${prod.id}" data-action="delete">Eliminar</button>
      </div>
    `;
    catalogo.appendChild(card);
  });

  countEl.textContent = `${filtrados.length} producto(s)`;
}

// ================== CANCELAR EDICIÓN FORMULARIO PRINCIPAL ==================
cancelEditBtn.addEventListener("click", () => {
  form.reset();
  idInput.value = "";
  cancelEditBtn.style.display = "none";
});

// ================== EDITAR / ELIMINAR DESDE CATALOGO ==================
catalogo.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    const prod = products.find(p => p.id == id);
    if (!prod) return;

    // Abrir popup
    openProductPopup(prod);
  }

  if (action === "delete") {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
      products = products.filter(p => p.id != id);
      localStorage.setItem("products", JSON.stringify(products));
      renderCatalogo(searchInput.value);
    }
  }
});

// ================== BUSCAR ==================
searchInput.addEventListener("input", e => {
  renderCatalogo(e.target.value);
});

// ================== POPUP PRODUCTOS ==================
function openProductPopup(prod) {
  popupSku.value = prod.sku;
  popupName.value = prod.name;
  popupPrice.value = prod.price;
  popupStock.value = prod.stock;
  popupId.value = prod.id;
  currentImg.src = prod.image || "";
  currentImg.style.display = prod.image ? "block" : "none";
  popupImage.value = "";
  productPopup.classList.add("show");
}

// Cerrar popup
popupCloseBtn.addEventListener("click", () => productPopup.classList.remove("show"));
cancelPopupBtn.addEventListener("click", () => productPopup.classList.remove("show"));

// Guardar cambios desde popup
popupForm.addEventListener("submit", e => {
  e.preventDefault();
  const prod = products.find(p => p.id == popupId.value);
  if (!prod) return;

  const file = popupImage.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = ev => savePopupProduct(prod, ev.target.result);
    reader.readAsDataURL(file);
  } else {
    savePopupProduct(prod, prod.image);
  }
});

function savePopupProduct(prod, imageBase64) {
  prod.sku = popupSku.value.trim();
  prod.name = popupName.value.trim();
  prod.price = parseFloat(popupPrice.value) || 0;
  prod.stock = parseInt(popupStock.value) || 0;
  prod.image = imageBase64;

  if (!prod.sku || !prod.name || prod.price <= 0 || prod.stock < 0) {
    alert("Completa todos los campos correctamente y asegúrate que precio > 0 y stock >= 0");
    return;
  }

  products = products.map(p => p.id == prod.id ? prod : p);
  localStorage.setItem("products", JSON.stringify(products));
  productPopup.classList.remove("show");
  renderCatalogo(searchInput.value);
}

// ================== INICIO ==================
renderCatalogo();
