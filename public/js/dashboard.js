// 1. HELPER

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("HTTP status " + res.status);
  return res.json();
}

function formatNumber(v) {
  if (v === null || v === undefined) return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  return n.toFixed(1);
}

// 2. UPDATE CURRENT VALUES
function updateCurrentValues(latest) {
  console.log('updateCurrentValues latest =', latest);

  if (!latest) return;

  const tempText  = formatNumber(latest.Temperature);
  const dustText  = formatNumber(latest.Dust);
  const pressText = formatNumber(latest.Pressure);

  // THÊM tempVal / dustVal / pressVal VÀO MỖI MẢNG
  const tempIds  = ['currentTemp',  'tempValue',  'tempNow',  'tempVal'];
  const dustIds  = ['currentDust',  'dustValue',  'dustNow',  'dustVal'];
  const pressIds = ['currentPress', 'pressValue', 'pressNow', 'pressVal'];

  tempIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = tempText;
  });
  

  dustIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = dustText;
  });

  pressIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = pressText;
  });
}

// 3. BIẾN LƯU INSTANCE CỦA CHART
let tempChartInstance = null;
let dustChartInstance = null;
let pressChartInstance = null;

// 4. VẼ BIỂU ĐỒ
// Format label HH:mm theo giờ VN
function formatTimeLabel(raw) {
  if (!raw) return '';
  const dt = new Date(raw);
  return dt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function buildCharts(series) {
  if (!Array.isArray(series) || series.length === 0) return;

  const labels = series.map(r => formatTimeLabel(r.At));
  const temps   = series.map(r => Number(r.Temperature));
  const dusts   = series.map(r => Number(r.Dust));
  const presses = series.map(r => Number(r.Pressure));

  const tempCtx  = document.getElementById('tempChart')?.getContext('2d');
  const dustCtx  = document.getElementById('dustChart')?.getContext('2d');
  const pressCtx = document.getElementById('pressChart')?.getContext('2d');

  if (!tempCtx || !dustCtx || !pressCtx) return;

  // Hủy chart cũ trước khi vẽ
  if (tempChartInstance) {
    tempChartInstance.destroy();
    tempChartInstance = null;
  }
  if (dustChartInstance) {
    dustChartInstance.destroy();
    dustChartInstance = null;
  }
  if (pressChartInstance) {
    pressChartInstance.destroy();
    pressChartInstance = null;
  }

  tempChartInstance = new Chart(tempCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Nhiệt độ (°C)',
        data: temps,
        borderColor: '#FF6384',
        tension: 0.3,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 60, minRotation: 60 } },
        y: { beginAtZero: false }
      }
    }
  });

  dustChartInstance = new Chart(dustCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Độ bụi (µg/m³)',
        data: dusts,
        borderColor: '#36A2EB',
        tension: 0.3,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 60, minRotation: 60 } },
        y: { beginAtZero: false }
      }
    }
  });

  pressChartInstance = new Chart(pressCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Áp suất (hPa)',
        data: presses,
        borderColor: '#4BC0C0',
        tension: 0.3,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 60, minRotation: 60 } },
        y: { beginAtZero: false }
      }
    }
  });
}

// 5. KHỞI ĐỘNG DASHBOARD

async function initDashboard() {
  try {
    const [latest, series] = await Promise.all([
      fetchJson('/api/stats/latest'),
      fetchJson('/api/stats/series?hours=24')
    ]);

    updateCurrentValues(latest);
    buildCharts(series);

  } catch (err) {
    console.error("Lỗi load dashboard:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setInterval(initDashboard, 60000);
});
