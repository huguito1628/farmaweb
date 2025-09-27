// assets/report.js
document.addEventListener("DOMContentLoaded", () => {
  const btnReporte = document.getElementById("btnReporte");
  const reportModal = document.getElementById("reportModal");
  const closeModal = document.getElementById("closeModal");
  let salesChart;

  btnReporte.addEventListener("click", () => {
    reportModal.style.display = "flex";
    setTimeout(() => reportModal.classList.add("show"), 10);
    setTimeout(() => generarGrafico(), 50); // genera gráfico con datos actualizados
  });

  closeModal.addEventListener("click", () => {
    reportModal.classList.remove("show");
    setTimeout(() => reportModal.style.display = "none", 300);
  });

  function generarGrafico() {
    // ✅ Leer pedidos actualizados al momento de abrir el reporte
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    const ventas = {};
    const unidadesPorProducto = {};
    let totalGeneral = 0;

    // Calcular ventas y unidades por producto
    orders.forEach(order => {
      totalGeneral += order.total;
      order.items.forEach(item => {
        if (!ventas[item.name]) ventas[item.name] = 0;
        if (!unidadesPorProducto[item.name]) unidadesPorProducto[item.name] = 0;
        ventas[item.name] += item.subtotal;
        unidadesPorProducto[item.name] += Number(item.qty || 0); // ✔ usamos qty
      });
    });

    // Ordenar productos de mayor a menor
    const sortedVentas = Object.entries(ventas).sort((a, b) => b[1] - a[1]);
    const topN = 20;
    const topVentas = sortedVentas.slice(0, topN);
    const otros = sortedVentas.slice(topN);
    const otrosTotal = otros.reduce((sum, e) => sum + e[1], 0);

    if (otrosTotal > 0) topVentas.push(["Otros", otrosTotal]);

    const labels = topVentas.map(e => e[0]);
    const data = topVentas.map(e => e[1]);

    if (salesChart) salesChart.destroy();

    const ctx = document.getElementById("salesChart").getContext("2d");

    // Paleta minimalista de verdes
    const colors = ["#10b981", "#22c55e", "#34d399", "#6ee7b7", "#86efac"];
    const backgroundColors = labels.map((_, i) => colors[i % colors.length]);

    salesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Ganancia por producto",
          data,
          backgroundColor: backgroundColors,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Ganancia total: $${totalGeneral.toFixed(2)}`,
            font: { size: 16, weight: "500" },
            color: "#065f46"
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const producto = context.label;
                const ganancia = context.raw.toFixed(2);
                const unidades = unidadesPorProducto[producto] || 0;
                return [`Ganancia: $${ganancia}`, `Unidades: ${unidades}`];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#065f46", font: { weight: "500" } },
            grid: { color: "rgba(16, 185, 129, 0.1)" }
          },
          x: {
            ticks: { color: "#065f46", font: { weight: "500" } },
            grid: { display: false }
          }
        }
      }
    });
  }
});
