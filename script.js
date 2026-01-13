const { jsPDF } = window.jspdf;

// Full and short month names
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const monthsShort = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const calendar = document.getElementById("calendar");
const totalMilkInput = document.getElementById("totalMilk");
const reportOutput = document.getElementById("reportOutput");

/* ===== TODAY DATE ===== */
function showToday() {
  const t = new Date();
  document.getElementById("todayDate").innerText = `${String(
    t.getDate()
  ).padStart(2, "0")}-${String(t.getMonth() + 1).padStart(
    2,
    "0"
  )}-${t.getFullYear()}`;
  document.getElementById("todayDay").innerText = t.toLocaleDateString("en", {
    weekday: "long",
  });
}
showToday();

/* ===== LOAD MONTHS ===== */
function updateMonthOptions() {
  const isMobile = window.innerWidth <= 480; // Mobile width
  monthSelect.innerHTML = "";
  months.forEach((m, i) => {
    let o = document.createElement("option");
    o.value = i;
    o.text = isMobile ? monthsShort[i] : m.toUpperCase();
    monthSelect.appendChild(o);
  });
}
updateMonthOptions();

// preserve selection on resize
window.addEventListener("resize", () => {
  const selectedMonth = monthSelect.value;
  updateMonthOptions();
  monthSelect.value = selectedMonth;
});

/* ===== LOAD YEARS ===== */
const cy = new Date().getFullYear();
for (let y = cy - 3; y <= cy + 3; y++) {
  let o = document.createElement("option");
  o.value = y;
  o.text = y;
  yearSelect.appendChild(o);
}

monthSelect.value = new Date().getMonth();
yearSelect.value = cy;

monthSelect.onchange = loadMonth;
yearSelect.onchange = loadMonth;

/* ===== HELPER FUNCTIONS ===== */
function daysInMonth(m, y) {
  return new Date(y, m + 1, 0).getDate();
}
function key(m, y) {
  return `milk_${y}_${m}`;
}

/* ===== PARSE MILK LOGIC ===== */
function parseMilk(val) {
  if (!val) return 0;
  val = val.toString().toLowerCase().trim();

  // Remove invalid characters
  val = val.replace(/[^0-9.l]/g, "");

  let base = 0,
    extra = 0;
  let parts = val.split(".");
  base = parseFloat(parts[0]) || 0;

  if (parts[1]) {
    let decimalPart = parts[1];
    let lCount = 0;
    let decimalDigits = "";

    for (let ch of decimalPart) {
      if (ch === "l") lCount++;
      else if (ch >= "0" && ch <= "9") decimalDigits += ch;
    }

    if (decimalDigits) extra += parseFloat("0." + decimalDigits);
    extra += lCount * 0.25;
  }

  return base + extra;
}

/* ===== LOAD CALENDAR ===== */
function loadMonth() {
  calendar.innerHTML = "";
  const m = +monthSelect.value;
  const y = +yearSelect.value;
  let data = JSON.parse(localStorage.getItem(key(m, y))) || [];
  let days = daysInMonth(m, y);

  for (let d = 1; d <= days; d++) {
    let v = data[d - 1] || { morning: "", night: "" };
    let div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `
      <b>Day ${d}</b>
      <input type="text" placeholder="Morning"
        value="${v.morning}" oninput="saveData(${d - 1})">
      <input type="text" placeholder="Night"
        value="${v.night}" oninput="saveData(${d - 1})">
    `;
    calendar.appendChild(div);
  }
  updateTotal();
}

/* ===== SAVE DATA ===== */
window.saveData = function (i) {
  const m = monthSelect.value;
  const y = yearSelect.value;
  let arr = JSON.parse(localStorage.getItem(key(m, y))) || [];
  let inp = calendar.children[i].querySelectorAll("input");

  arr[i] = { morning: inp[0].value, night: inp[1].value };
  localStorage.setItem(key(m, y), JSON.stringify(arr));
  updateTotal();
};

/* ===== UPDATE TOTAL ===== */
function updateTotal() {
  let sum = 0;
  document.querySelectorAll(".day input").forEach((i) => {
    sum += parseMilk(i.value);
  });
  totalMilkInput.value = sum.toFixed(2);
}

/* ===== CALCULATE AMOUNT ===== */
function calculate() {
  let price = document.getElementById("price").value || 0;
  document.getElementById("result").innerText = (
    totalMilkInput.value * price
  ).toFixed(2);
}

/* ===== SHOW REPORT ===== */
function showReport() {
  let text = "",
    yearly = 0;
  const y = yearSelect.value;
  months.forEach((m, i) => {
    let d = JSON.parse(localStorage.getItem(key(i, y))) || [];
    let t = d.reduce(
      (s, x) => s + parseMilk(x?.morning) + parseMilk(x?.night),
      0
    );
    yearly += t;
    text += `${m}: ${t.toFixed(2)} kg\n`;
  });
  text += `\nYear ${y} Total: ${yearly.toFixed(2)} kg`;
  reportOutput.textContent = text;
}

/* ===== DOWNLOAD MONTHLY PDF ===== */
function downloadMonthlyPDF() {
  const doc = new jsPDF();
  const m = monthSelect.value;
  const y = yearSelect.value;
  doc.text(`Milk Report - ${months[m]} ${y}`, 10, 10);

  let d = JSON.parse(localStorage.getItem(key(+m, +y))) || [];
  let txt = "";
  d.forEach((x, i) => {
    txt += `Day ${i + 1} - Morning: ${x?.morning || 0}, Night: ${
      x?.night || 0
    }\n`;
  });
  doc.text(txt, 10, 20);
  doc.text(`Total Milk: ${totalMilkInput.value} kg`, 10, 250);
  doc.save(`${months[m]}_${y}_Milk.pdf`);
}

/* ===== DOWNLOAD YEARLY PDF ===== */
function downloadYearlyPDF() {
  const doc = new jsPDF();
  let txt = "",
    total = 0;
  const y = yearSelect.value;
  months.forEach((m, i) => {
    let d = JSON.parse(localStorage.getItem(key(i, y))) || [];
    let t = d.reduce(
      (s, x) => s + parseMilk(x?.morning) + parseMilk(x?.night),
      0
    );
    total += t;
    txt += `${m}: ${t.toFixed(2)} kg\n`;
  });
  doc.text(`Yearly Milk Report ${y}`, 10, 10);
  doc.text(txt, 10, 25);
  doc.text(`Total: ${total.toFixed(2)} kg`, 10, 250);
  doc.save(`${y}_Yearly_Milk.pdf`);
}

/* ===== DARK MODE ===== */
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

/* ===== INIT ===== */
loadMonth();

// REGISTER PWA SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./pwa/service-worker.js", { scope: "./" })
      .then((reg) => {
        console.log("✅ Service Worker Registered:", reg.scope);
      })
      .catch((err) => {
        console.error("❌ Service Worker Error:", err);
      });
  });
}
