// === Utilidades para localStorage ===
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// === Variables globales ===
let orders = getData("orders");
let products = getData("products");
let clients = getData("clients");

// === Referencias al DOM ===
const clientInput = document.getElementById("clientInput");
const clientList = document.getElementById("clientList");
const orderDate = document.getElementById("orderDate");
const addItemBtn = document.getElementById("addItem");
const itemsBody = document.getElementById("itemsBody");
const totalEl = document.getElementById("total");
const orderForm = document.getElementById("orderForm");
const ordersBody = document.getElementById("ordersBody");
const ordersCount = document.getElementById("ordersCount");

// === Popup universal ===
const universalPopup = document.getElementById("universalPopup");
const closeUniversalPopup = document.getElementById("closeUniversalPopup");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");

function showPopup(title, message, type = "success") {
  universalPopup.className = `popup show ${type}`;
  popupTitle.textContent = title;
  popupMessage.textContent = message;

  closeUniversalPopup.onclick = () => universalPopup.classList.remove("show");
  setTimeout(() => universalPopup.classList.remove("show"), 3000);
}

// === Inicialización ===
function init() {
  clients = getData("clients");
  products = getData("products");
  renderOrders();
  orderDate.valueAsDate = new Date();
}
document.addEventListener("DOMContentLoaded", init);

// ============================
// AUTOCOMPLETADO CLIENTES
// ============================
clientInput.addEventListener("input", () => {
  const query = clientInput.value.toLowerCase();
  clientList.innerHTML = "";
  if (!query) return;

  const matches = clients.filter(c => c.name.toLowerCase().includes(query));
  matches.forEach(client => {
    const li = document.createElement("li");
    li.textContent = client.name;
    li.addEventListener("click", () => {
      clientInput.value = client.name;
      clientList.innerHTML = "";
    });
    clientList.appendChild(li);
  });
});

document.addEventListener("click", e => {
  if (!clientInput.contains(e.target)) clientList.innerHTML = "";
});

// ============================
// FUNCIONES DE PRODUCTOS
// ============================
function createProductRow() {
  const tr = document.createElement("tr");

  const tdProduct = document.createElement("td");
  tdProduct.style.position = "relative";
  const productInput = document.createElement("input");
  productInput.type = "text";
  productInput.className = "productInput input";
  productInput.placeholder = "Escribe el producto";
  const productList = document.createElement("ul");
  productList.className = "productList autocomplete-list";
  tdProduct.appendChild(productInput);
  tdProduct.appendChild(productList);

  const priceTd = document.createElement("td");
  const stockTd = document.createElement("td");
  const qtyTd = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = 1;
  qtyInput.value = 1;
  qtyInput.className = "qtyInput input";
  qtyTd.appendChild(qtyInput);

  const subtotalTd = document.createElement("td");

  const tdAction = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "❌";
  removeBtn.className = "btn ghost";
  tdAction.appendChild(removeBtn);

  tr.appendChild(tdProduct);
  tr.appendChild(priceTd);
  tr.appendChild(stockTd);
  tr.appendChild(qtyTd);
  tr.appendChild(subtotalTd);
  tr.appendChild(tdAction);

  // Autocomplete producto
  productInput.addEventListener("input", () => {
    const query = productInput.value.toLowerCase();
    productList.innerHTML = "";
    if (!query) return;

    const matches = products.filter(p => p.name.toLowerCase().includes(query));
    matches.forEach(p => {
      const li = document.createElement("li");
      li.textContent = p.name;
      li.addEventListener("click", () => {
        productInput.value = p.name;
        productList.innerHTML = "";

        priceTd.textContent = `$${p.price.toFixed(2)}`;
        stockTd.textContent = p.stock;
        qtyInput.max = p.stock;
        subtotalTd.textContent = `$${(p.price * parseInt(qtyInput.value || 0)).toFixed(2)}`;
        updateTotal();
      });
      productList.appendChild(li);
    });
  });

  document.addEventListener("click", e => {
    if (!tdProduct.contains(e.target)) productList.innerHTML = "";
  });

  qtyInput.addEventListener("input", () => {
    const p = products.find(pr => pr.name === productInput.value);
    if (!p) return;
    subtotalTd.textContent = `$${(p.price * parseInt(qtyInput.value || 0)).toFixed(2)}`;
    updateTotal();
  });

  removeBtn.addEventListener("click", () => {
    tr.remove();
    updateTotal();
  });

  itemsBody.appendChild(tr);
}

// ============================
// AGREGAR ÍTEM
// ============================
addItemBtn.addEventListener("click", () => createProductRow());

// ============================
// CALCULAR TOTAL
// ============================
function updateTotal() {
  let total = 0;
  itemsBody.querySelectorAll("tr").forEach(tr => {
    const productInput = tr.querySelector(".productInput");
    const qtyInput = tr.querySelector(".qtyInput");
    const product = products.find(p => p.name === productInput.value);
    if (product) total += product.price * parseInt(qtyInput.value || 0);
  });
  totalEl.textContent = `$${total.toFixed(2)}`;
}

// ============================
// GUARDAR PEDIDO
// ============================
orderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (itemsBody.children.length === 0) {
    showPopup("Atención", "Agrega al menos un ítem al pedido", "warning");
    return;
  }

  const selectedClient = clients.find(c => c.name === clientInput.value);
  if (!selectedClient) {
    showPopup("Error", "Selecciona un cliente válido", "error");
    return;
  }

  const clientId = selectedClient.id;
  const date = orderDate.value;
  const orderItems = [];
  let total = 0;
  let valid = true;

  itemsBody.querySelectorAll("tr").forEach(tr => {
    const productInput = tr.querySelector(".productInput");
    const qtyInput = tr.querySelector(".qtyInput");
    const product = products.find(p => p.name === productInput.value);
    const qty = parseInt(qtyInput.value || 0);

    if (!product) {
      valid = false;
      showPopup("Error", "Selecciona un producto válido", "error"); // <--- agregado
      return;
    }

    if (qty <= 0 || qty > product.stock) {
      valid = false;
      showPopup("Error", "Verifica las cantidades y el stock de los productos", "error");
      return;
    }

    total += product.price * qty;
    orderItems.push({
      sku: product.sku,
      name: product.name,
      price: product.price,
      qty,
      subtotal: product.price * qty
    });

    product.stock -= qty;
  });

  if (!valid) return; // detiene el guardado si hay errores

  setData("products", products);
  orders.push({ id: Date.now(), date, clientId, items: orderItems, total });
  setData("orders", orders);

  // Limpiar formulario
  itemsBody.innerHTML = "";
  clientInput.value = "";
  updateTotal();
  renderOrders();

  showPopup("Éxito", "Pedido registrado correctamente", "success");
});

// ============================
// RENDERIZAR HISTORIAL
// ============================
function renderOrders() {
  ordersBody.innerHTML = "";
  orders.forEach(o => {
    const client = clients.find(c => c.id === o.clientId);
    const clientName = client ? client.name : "Cliente desconocido";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.date}</td>
      <td>${clientName}</td>
      <td>${o.items.map(i => `${i.name} x${i.qty}`).join(", ")}</td>
      <td>$${o.total.toFixed(2)}</td>
    `;
    ordersBody.appendChild(tr);
  });
  ordersCount.textContent = `${orders.length} pedido(s)`;
}
