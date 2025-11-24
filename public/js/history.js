// Load lịch sử 100 lần đo, hiển thị + lọc
let allRows = [];

// Format số cho bảng
function formatNumber(v) {
  if (v === null || v === undefined) return '--';
  const num = Number(v);
  if (!Number.isFinite(num)) return '--';
  return num.toFixed(1);
}

// Hiển thị thời gian: DD/MM/YYYY HH:mm, múi giờ Việt Nam, 24h
function formatTime(raw) {
  if (!raw) return '--';
  return new Date(raw).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Render bảng lịch sử
function renderHistoryTable(rows) {
  const tbody = document.getElementById('historyBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');

    const time = formatTime(r.At || r.Timestamp);

    tr.innerHTML = `
      <td>${r.Id ?? i + 1}</td>
      <td>${formatNumber(r.Temperature)}</td>
      <td>${formatNumber(r.Dust)}</td>
      <td>${formatNumber(r.Pressure)}</td>
      <td>${time}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Load từ API + lưu allRows
async function loadHistory() {
  try {
    const res = await fetch('/api/stats/history', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const rows = await res.json();
    allRows = Array.isArray(rows) ? rows : [];

    // Sau khi load mới, áp dụng lại filter (nếu có)
    applyFilter();
  } catch (err) {
    console.error('Lỗi loadHistory:', err);
  }
}

// Áp dụng bộ lọc
function applyFilter() {
  if (!allRows.length) {
    renderHistoryTable([]);
    return;
  }

  const fromVal     = document.getElementById('fromTime')?.value;
  const toVal       = document.getElementById('toTime')?.value;
  const minTempVal  = document.getElementById('minTemp')?.value;
  const minDustVal  = document.getElementById('minDust')?.value;
  const minPressVal = document.getElementById('minPress')?.value;

  let filtered = allRows.slice();

  // Thời gian từ
  if (fromVal) {
    const fromTime = new Date(fromVal);
    filtered = filtered.filter(r => new Date(r.At || r.Timestamp) >= fromTime);
  }

  // Thời gian đến
  if (toVal) {
    const toTime = new Date(toVal);
    filtered = filtered.filter(r => new Date(r.At || r.Timestamp) <= toTime);
  }

  // Ngưỡng nhiệt độ ≥
  const minTemp = parseFloat(minTempVal);
  if (!Number.isNaN(minTemp)) {
    filtered = filtered.filter(r => {
      const t = Number(r.Temperature);
      return Number.isFinite(t) && t >= minTemp;
    });
  }

  // Ngưỡng độ bụi ≥
  const minDust = parseFloat(minDustVal);
  if (!Number.isNaN(minDust)) {
    filtered = filtered.filter(r => {
      const d = Number(r.Dust);
      return Number.isFinite(d) && d >= minDust;
    });
  }

  // Ngưỡng áp suất ≥
  const minPress = parseFloat(minPressVal);
  if (!Number.isNaN(minPress)) {
    filtered = filtered.filter(r => {
      const p = Number(r.Pressure);
      return Number.isFinite(p) && p >= minPress;
    });
  }

  renderHistoryTable(filtered);
}

// Reset filter
function resetFilter() {
  ['fromTime','toTime','minTemp','minDust','minPress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderHistoryTable(allRows);
}

// Khởi động + auto refresh
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();                    // lần đầu
  setInterval(loadHistory, 60000);  // tự load lại mỗi 60s

  const applyBtn = document.getElementById('applyFilterBtn');
  const resetBtn = document.getElementById('resetFilterBtn');

  if (applyBtn)
    applyBtn.addEventListener('click', e => {
      e.preventDefault();
      applyFilter();
    });

  if (resetBtn)
    resetBtn.addEventListener('click', e => {
      e.preventDefault();
      resetFilter();
    });
});
