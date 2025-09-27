// === Utilidades para localStorage ===
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// === Variables globales ===
let clients = getData("clients");
let editId = null;

// === Referencias al DOM ===
const form = document.getElementById('clientForm');
const tbody = document.getElementById('tbody');
const searchInput = document.getElementById('search');
const count = document.getElementById('count');

const dniInput = document.getElementById('dniInput');
const dniBtn = document.getElementById('dniBtn');
const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Implc3VzbWEzNjAwQGdtYWlsLmNvbSJ9.3NEcKdFiPcFybLYZkD4Hgba0xn3JX_-d2QCX_luQxPY";

// === Popup ===
const popup = document.getElementById('clientPopup');
const popupTitle = popup.querySelector('.popup-title');
const popupMessage = popup.querySelector('.popup-message');
const closePopupBtn = document.getElementById('closeClientPopup');

function showPopup(title, message, type = "success") {
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popup.className = `popup show ${type}`;
}

closePopupBtn.addEventListener('click', () => popup.classList.remove('show'));

// === Inicialización ===
document.addEventListener('DOMContentLoaded', renderClients);

// === CONSULTA DNI ===
dniBtn.addEventListener('click', async () => {
  const dni = dniInput.value.trim();
  if (dni.length !== 8 || isNaN(dni)) {
    showPopup("Atención", "Ingresa un DNI válido de 8 dígitos", "warning");
    return;
  }

  try {
    const response = await fetch(`https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${API_KEY}`);
    const data = await response.json();

    if (data.dni) {
      form.name.value = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
      showPopup("Éxito", "DNI consultado correctamente", "success");
    } else {
      showPopup("Error", "No se encontró información para ese DNI", "error");
    }
  } catch (error) {
    console.error(error);
    showPopup("Error", "Error al consultar el DNI", "error");
  }
});

// === FUNCIONES CLIENTES ===
function saveToStorage() {
  setData('clients', clients);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();

  if (!name || !phone || !email) {
    showPopup("Atención", "Completa todos los campos", "warning");
    return;
  }

  if (editId !== null) {
    // Editar cliente
    clients = clients.map(c => c.id === editId ? { id: editId, name, phone, email } : c);
    showPopup("Éxito", "Cliente editado correctamente", "success");
    editId = null;
  } else {
    // Nuevo cliente
    const id = Date.now();
    clients.push({ id, name, phone, email });
    showPopup("Éxito", "Cliente registrado correctamente", "success");
  }

  saveToStorage();
  form.reset();
  form.querySelector('#cancelEdit').style.display = "none";
  renderClients();
});

// Cancelar edición
form.querySelector('#cancelEdit').addEventListener('click', () => {
  form.reset();
  editId = null;
  form.querySelector('#cancelEdit').style.display = "none";
});

// Renderizar clientes
function renderClients() {
  const filter = searchInput.value.toLowerCase();
  tbody.innerHTML = "";
  let visibleCount = 0;

  clients.forEach(client => {
    if (client.name.toLowerCase().includes(filter) || client.email.toLowerCase().includes(filter)) {
      visibleCount++;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${client.name}</td>
        <td>${client.phone}</td>
        <td>${client.email}</td>
        <td>
          <button class="btn edit">Editar</button>
          <button class="btn secondary delete">Eliminar</button>
        </td>
      `;

      // Editar en popup
      tr.querySelector('.edit').addEventListener('click', () => {
        showPopup("Editar Cliente", "", "success");
        const content = `
          <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
            <label>Nombre</label>
            <input class="input" id="popupName" value="${client.name}">
            <label>Teléfono</label>
            <input class="input" id="popupPhone" value="${client.phone}">
            <label>Email</label>
            <input class="input" id="popupEmail" value="${client.email}">
            <button id="savePopupClient" class="btn" style="margin-top:10px;">Guardar cambios</button>
          </div>
        `;
        popupMessage.innerHTML = content;

        const saveBtn = document.getElementById('savePopupClient');
        saveBtn.addEventListener('click', () => {
          const newName = document.getElementById('popupName').value.trim();
          const newPhone = document.getElementById('popupPhone').value.trim();
          const newEmail = document.getElementById('popupEmail').value.trim();
          if (!newName || !newPhone || !newEmail) {
            showPopup("Atención", "Completa todos los campos", "warning");
            return;
          }
          client.name = newName;
          client.phone = newPhone;
          client.email = newEmail;
          saveToStorage();
          renderClients();
          popup.classList.remove('show');
          showPopup("Éxito", "Cliente actualizado correctamente", "success");
        });
      });

      // Eliminar cliente
      tr.querySelector('.delete').addEventListener('click', () => {
        showPopup("Confirmación", `¿Eliminar a ${client.name}?`, "warning");
        const confirmContent = `
          <div style="display:flex; flex-direction:column; gap:12px; text-align:center;">
            <button id="confirmDelete" class="btn">Sí, eliminar</button>
            <button id="cancelDelete" class="btn secondary">Cancelar</button>
          </div>
        `;
        popupMessage.innerHTML = confirmContent;

        document.getElementById('confirmDelete').addEventListener('click', () => {
          clients = clients.filter(c => c.id !== client.id);
          saveToStorage();
          renderClients();
          popup.classList.remove('show');
          showPopup("Éxito", "Cliente eliminado correctamente", "success");
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
          popup.classList.remove('show');
        });
      });

      tbody.appendChild(tr);
    }
  });

  count.textContent = `Clientes: ${visibleCount}`;
}

// Búsqueda en tiempo real
searchInput.addEventListener('input', renderClients);
