'use strict';

/* =========================================================
   udara. — Monitor & Prediksi Kualitas Udara Indonesia
   Data: Open-Meteo Air Quality API (tanpa API key)
   ========================================================= */

const API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const URL_PARAMS = {
  current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi',
  hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi',
  timezone: 'auto',
  past_days: '2',
  forecast_days: '5'
};

const CITIES = [
  { id: 'medan', name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722 },
  { id: 'jakarta', name: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456 },
  { id: 'pekanbaru', name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lon: 101.4478 },
  { id: 'bandung', name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191 },
  { id: 'surabaya', name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521 },
  { id: 'palembang', name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lon: 104.7754 },
  { id: 'makassar', name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lon: 119.4327 }
];

const ISPU_INDEX_LEVELS = [0, 50, 100, 200, 300, 500];

const KATEGORI = [
  {
    slug: 'baik',
    label: 'Baik',
    range: '1–50',
    max: 50,
    icon: 'i-leaf',
    hero: 'Udara di {city} sedang bersih. Waktu yang tepat untuk menghirup udara segar dan beraktivitas di luar ruangan.',
    title: 'Napas lega, udara sedang bersih',
    text: 'Kualitas udara di {city} masuk kategori baik. Kondisi ini aman untuk sebagian besar orang, termasuk anak-anak dan kelompok sensitif.',
    tips: [
      'Aman berolahraga dan beraktivitas di luar ruangan.',
      'Buka jendela untuk sirkulasi udara alami.',
      'Tetap jaga kebersihan lingkungan sekitar.'
    ]
  },
  {
    slug: 'sedang',
    label: 'Sedang',
    range: '51–100',
    max: 100,
    icon: 'i-shield',
    hero: 'Kualitas udara di {city} masih dapat diterima, tetapi kelompok sensitif sebaiknya tetap waspada.',
    title: 'Masih aman, tetap waspada',
    text: 'Udara di {city} tergolong sedang. Sebagian besar orang masih bisa beraktivitas, namun kelompok sensitif perlu memperhatikan kondisi tubuh.',
    tips: [
      'Kelompok sensitif sebaiknya mengurangi aktivitas berat di luar.',
      'Masih aman untuk aktivitas ringan; pantau keluhan pernapasan.',
      'Pertimbangkan masker jika udara terasa berdebu.'
    ]
  },
  {
    slug: 'tidak-sehat',
    label: 'Tidak Sehat',
    range: '101–200',
    max: 200,
    icon: 'i-alert',
    hero: 'Polusi di {city} sedang tinggi. Kurangi waktu dan intensitas aktivitas di luar ruangan hari ini.',
    title: 'Kurangi aktivitas di luar ruangan',
    text: 'Kualitas udara di {city} mulai merugikan kesehatan. Anak-anak, lansia, dan orang dengan gangguan pernapasan paling rentan.',
    tips: [
      'Kurangi durasi dan intensitas aktivitas di luar ruangan.',
      'Gunakan masker saat harus keluar rumah.',
      'Tutup jendela dan nyalakan penyaring udara bila ada.'
    ]
  },
  {
    slug: 'sangat-tidak-sehat',
    label: 'Sangat Tidak Sehat',
    range: '201–300',
    max: 300,
    icon: 'i-alert',
    hero: 'Kualitas udara di {city} sangat tidak sehat. Hindari paparan luar ruangan dan tutup ventilasi rumah.',
    title: 'Saatnya tetap di dalam ruangan',
    text: 'Paparan udara di {city} berisiko bagi semua orang. Batasi aktivitas luar ruangan dan lindungi kelompok sensitif.',
    tips: [
      'Hindari aktivitas luar ruangan untuk semua kelompok.',
      'Tutup jendela dan pintu, gunakan air purifier.',
      'Kelompok sensitif sebaiknya tetap di dalam ruangan.'
    ]
  },
  {
    slug: 'berbahaya',
    label: 'Berbahaya',
    range: '301+',
    max: 500,
    icon: 'i-alert',
    hero: 'Kondisi udara di {city} berbahaya. Tetap di dalam ruangan dan ikuti arahan otoritas setempat.',
    title: 'Kondisi darurat, batasi semua aktivitas',
    text: 'Kualitas udara di {city} berada pada level berbahaya. Paparan dapat menimbulkan dampak kesehatan serius bagi seluruh populasi.',
    tips: [
      'Tetap di dalam ruangan dan batasi aktivitas fisik.',
      'Tutup semua ventilasi dan gunakan penyaring udara.',
      'Ikuti arahan resmi dari otoritas setempat.'
    ]
  }
];

const POLLUTANTS = [
  {
    key: 'pm2_5', label: 'PM2.5', name: 'Partikulat halus', icon: 'i-pm', unit: 'µg/m³', digits: 1,
    breakpoints: [15.5, 55.4, 150.4, 250.4, 500],
    description: 'Partikel berukuran maksimal 2,5 mikrometer yang dapat masuk jauh ke dalam paru-paru.'
  },
  {
    key: 'pm10', label: 'PM10', name: 'Partikulat kasar', icon: 'i-pm', unit: 'µg/m³', digits: 1,
    breakpoints: [50, 150, 350, 420, 500],
    description: 'Debu dan polutan dengan diameter maksimal 10 mikrometer.'
  },
  {
    key: 'nitrogen_dioxide', label: 'NO₂', name: 'Nitrogen dioksida', icon: 'i-car', unit: 'µg/m³', digits: 1,
    breakpoints: [80, 200, 1130, 2260, 3000],
    description: 'Gas pencemar dari pembakaran kendaraan bermotor dan aktivitas industri.'
  },
  {
    key: 'carbon_monoxide', label: 'CO', name: 'Karbon monoksida', icon: 'i-flame', unit: 'µg/m³', digits: 0,
    breakpoints: [4000, 8000, 15000, 30000, 45000],
    description: 'Gas berbahaya yang dihasilkan dari pembakaran tidak sempurna.'
  },
  {
    key: 'ozone', label: 'O₃', name: 'Ozon permukaan', icon: 'i-sun', unit: 'µg/m³', digits: 1,
    breakpoints: [120, 235, 400, 800, 1000],
    description: 'Ozon dekat permukaan bumi yang dapat mengganggu kesehatan pernapasan.'
  },
  {
    key: 'sulphur_dioxide', label: 'SO₂', name: 'Sulfur dioksida', icon: 'i-factory', unit: 'µg/m³', digits: 1,
    breakpoints: [52, 180, 400, 800, 1200],
    description: 'Gas dari pembakaran bahan bakar fosil dan aktivitas industri.'
  }
];

const POLLUTANT_BY_KEY = Object.fromEntries(POLLUTANTS.map((item) => [item.key, item]));
const CATEGORY_CLASSES = KATEGORI.map((item) => `cat-${item.slug}`);

const state = {
  city: CITIES[0],
  data: null,
  overview: null,
  window: 6,
  chart: null,
  chartHover: null,
  request: null,
  gaugeProgress: 0,
  gaugeAnimation: 0,
  toastTimer: null,
  loading: false
};

const valueAnimations = new WeakMap();

/* ---------- Utilities ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const VIEWS = ['ringkasan', 'prediksi', 'kota', 'edukasi'];
let currentView = null;

const nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString('id-ID', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mean(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getKategori(value) {
  const angka = Number(value);
  if (!Number.isFinite(angka)) return KATEGORI[0];
  return KATEGORI.find((kategori) => angka <= kategori.max) || KATEGORI[KATEGORI.length - 1];
}

function setCategoryClasses(element, kategori) {
  if (!element || !kategori) return;
  element.classList.remove(...CATEGORY_CLASSES);
  element.classList.add(`cat-${kategori.slug}`);
}

function getCityById(id) {
  return CITIES.find((city) => city.id === id) || null;
}

function getTimeZoneLabel(offsetSeconds) {
  if (offsetSeconds === 28800) return 'WITA';
  if (offsetSeconds === 32400) return 'WIT';
  return 'WIB';
}

function parseLocalDate(timeString) {
  const [datePart] = String(timeString).split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatJam(timeString) {
  if (!timeString || !timeString.includes('T')) return '—';
  const [hour, minute] = timeString.split('T')[1].slice(0, 5).split(':');
  return `${hour}.${minute}`;
}

function formatTanggalLengkap(timeString) {
  if (!timeString) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(parseLocalDate(timeString));
  } catch {
    return String(timeString).slice(0, 10);
  }
}

function formatTanggalPendek(timeString) {
  if (!timeString) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short'
    }).format(parseLocalDate(timeString));
  } catch {
    return String(timeString).slice(5, 10);
  }
}

function formatHari(timeString) {
  if (!timeString) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(parseLocalDate(timeString));
  } catch {
    return '—';
  }
}

function formatKoordinat(lat, lon) {
  const latText = `${Math.abs(lat).toFixed(4).replace('.', ',')}° ${lat >= 0 ? 'LU' : 'LS'}`;
  const lonText = `${Math.abs(lon).toFixed(4).replace('.', ',')}° ${lon >= 0 ? 'BT' : 'BB'}`;
  return `${latText} · ${lonText}`;
}

function animateNumber(element, target, digits = 0) {
  if (!element) return;
  const to = Number(target);
  if (!Number.isFinite(to)) {
    element.textContent = '—';
    element.dataset.value = '';
    return;
  }

  const from = Number(element.dataset.value);
  const startValue = Number.isFinite(from) ? from : 0;
  const previousFrame = valueAnimations.get(element);
  if (previousFrame) cancelAnimationFrame(previousFrame);

  if (reducedMotion.matches) {
    element.textContent = formatNumber(to, digits);
    element.dataset.value = String(to);
    return;
  }

  const duration = 720;
  const started = performance.now();

  const tick = (now) => {
    const progress = clamp((now - started) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = startValue + (to - startValue) * eased;
    element.textContent = formatNumber(value, digits);
    if (progress < 1) {
      valueAnimations.set(element, requestAnimationFrame(tick));
    } else {
      element.textContent = formatNumber(to, digits);
      element.dataset.value = String(to);
      valueAnimations.delete(element);
    }
  };

  valueAnimations.set(element, requestAnimationFrame(tick));
}

function cancelNumberAnimation(element) {
  if (!element) return;
  const frame = valueAnimations.get(element);
  if (frame) cancelAnimationFrame(frame);
  valueAnimations.delete(element);
  element.removeAttribute('data-value');
}

function showToast(message, icon = 'i-check') {
  const toast = $('#toast');
  if (!toast) return;
  toast.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg><span>${escapeHtml(message)}</span>`;
  toast.hidden = false;
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

/* ---------- Theme ---------- */
function getPreferredTheme() {
  try {
    const saved = localStorage.getItem('udara:theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* localStorage bisa diblokir */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, persist = false) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  const toggle = $('#themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(next === 'dark'));
    toggle.setAttribute('aria-label', next === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#07120f' : '#f3f8f6');
  if (persist) {
    try {
      localStorage.setItem('udara:theme', next);
    } catch {
      /* abaikan */
    }
  }
  if (state.chart) {
    window.requestAnimationFrame(() => drawChart(state.chartHover));
  }
}

function setupTheme() {
  applyTheme(getPreferredTheme());
  $('#themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  });
}

/* ---------- City selection & URL ---------- */
function readInitialCity() {
  let id = null;
  try {
    const params = new URLSearchParams(window.location.search);
    id = params.get('kota');
    if (!id) id = localStorage.getItem('udara:kota');
  } catch {
    /* abaikan */
  }
  return getCityById(id) || CITIES[0];
}

function saveSelectedCity(city) {
  try {
    localStorage.setItem('udara:kota', city.id);
  } catch {
    /* abaikan */
  }
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('kota', city.id);
      window.history.replaceState(null, '', url);
    } catch {
      /* abaikan */
    }
  }
}

function updateCityIdentity(scrollToTop = false) {
  const city = state.city;
  const heroCity = $('#heroCity');
  if (heroCity) heroCity.textContent = city.name;
  const heroCoords = $('#heroCoords');
  if (heroCoords) heroCoords.textContent = formatKoordinat(city.lat, city.lon);
  const adviceCity = $('#adviceCity');
  if (adviceCity) adviceCity.textContent = city.name;
  updateCityPills();
  if ($('#cityGrid')) renderCityCards();

  if (scrollToTop) {
    showView('ringkasan', { updateHash: true });
  }
}

async function selectCity(id, options = {}) {
  const city = getCityById(id);
  if (!city) return;
  const previousId = state.city.id;
  state.city = city;
  saveSelectedCity(city);
  updateCityIdentity(Boolean(options.scroll));

  if (previousId !== city.id) state.data = null;

  if (options.force || previousId !== city.id || !state.data) {
    await loadCityData(city, options);
  }
}

/* ---------- Fetch & API ---------- */
async function loadCityData(city, options = {}) {
  state.request?.abort();
  const controller = new AbortController();
  state.request = controller;
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 18000);

  setLoading(true);
  if (!options.silent && state.data?.city?.id !== city.id) renderWaitingState(city);

  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    ...URL_PARAMS
  });

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`API merespons dengan status ${response.status}`);

    const raw = await response.json();
    if (!raw?.current || !raw?.hourly?.time?.length) {
      throw new Error('Struktur data API tidak lengkap.');
    }
    if (controller.signal.aborted) return;

    state.data = normalizeCityData(raw, city);
    renderDashboard(state.data);
    hideError();
    if (options.toast) showToast(`Data ${city.name} diperbarui`);
  } catch (error) {
    if (error.name === 'AbortError' && !timedOut) return;
    console.error('Gagal memuat kualitas udara:', error);
    const message = timedOut
      ? 'Permintaan memakan waktu terlalu lama. Periksa koneksi internet, lalu coba lagi.'
      : 'Data kualitas udara belum bisa diambil. Periksa koneksi internet atau coba beberapa saat lagi.';
    showError(state.data ? `${message} Data terakhir tetap ditampilkan.` : message);
    if (!state.data) renderErrorState();
  } finally {
    window.clearTimeout(timeout);
    if (state.request === controller) {
      state.request = null;
      setLoading(false);
    }
  }
}

async function loadOverview() {
  const params = new URLSearchParams({
    latitude: CITIES.map((city) => city.lat).join(','),
    longitude: CITIES.map((city) => city.lon).join(','),
    current: 'pm2_5,us_aqi',
    timezone: 'auto'
  });

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const raw = await response.json();
    const list = Array.isArray(raw) ? raw : [raw];

    state.overview = CITIES.map((city, index) => {
      const item = list[index] || {};
      return {
        city,
        pm25: Number.isFinite(item?.current?.pm2_5) ? item.current.pm2_5 : null,
        usAqi: Number.isFinite(item?.current?.us_aqi) ? item.current.us_aqi : null
      };
    });
    renderCityCards();
    updateCityPills();
  } catch (error) {
    console.warn('Data ringkasan kota gagal dimuat:', error);
    state.overview = CITIES.map((city) => ({ city, pm25: null, usAqi: null }));
    renderCityCards();
  }
}

/* ---------- Loading, error & placeholders ---------- */
function setLoading(isLoading) {
  state.loading = isLoading;
  document.body.classList.toggle('is-loading', isLoading);
  const button = $('#refreshBtn');
  button?.classList.toggle('is-loading', isLoading);
  if (button) button.disabled = isLoading;
  $('#dashboardGrid')?.setAttribute('aria-busy', String(isLoading));
}

function showError(message) {
  const banner = $('#errorBanner');
  const text = $('#errorMessage');
  if (text) text.textContent = message;
  if (banner) banner.hidden = false;
}

function hideError() {
  const banner = $('#errorBanner');
  if (banner) banner.hidden = true;
}

function renderWaitingState(city) {
  hideError();
  setCategoryClasses($('#gaugeCard'), KATEGORI[0]);
  setCategoryClasses($('#adviceCard'), KATEGORI[0]);
  setCategoryClasses($('#adviceBadge'), KATEGORI[0]);
  setCategoryClasses($('#ispuBadge'), KATEGORI[0]);
  setCategoryClasses($('#predictionCategory'), KATEGORI[0]);
  setCategoryClasses($('#predictionSummary') || $('.prediction-summary'), KATEGORI[0]);

  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };

  setText('#heroCity', city.name);
  setText('#heroSummary', `Mengambil data kualitas udara terbaru untuk ${city.name}…`);
  setText('#heroDate', 'Memuat tanggal…');
  setText('#dataTimestamp', 'Menghubungi Open-Meteo…');
  setText('#updatedTime', 'Memuat…');
  setText('#ispuValue', '—');
  cancelNumberAnimation($('#ispuValue'));
  cancelNumberAnimation($('#usAqiValue'));
  cancelNumberAnimation($('#predictionAvg'));
  setText('#ispuBadge', 'Memuat data');
  setText('#ispuRange', 'Skala 1–500');
  setText('#dominantPollutant', '—');
  setText('#dominantValue', '—');
  setText('#usAqiValue', '—');
  setText('#adviceBadge', 'Memuat…');
  setText('#adviceTitle', 'Membaca kondisi udara…');
  setText('#adviceText', 'Saran kesehatan akan muncul setelah data berhasil dimuat.');
  setText('#adviceNote', 'Berdasarkan estimasi ISPU');
  setText('#adviceCity', city.name);
  setText('#pollutantHint', 'Memuat data…');
  setText('#predictionAvg', '—');
  setText('#predictionCategory', '—');
  setText('#predictionTrendText', 'Menghitung tren…');
  setText('#actualAvg', '—');
  setText('#peakPrediction', '—');
  setText('#peakTime', '—');
  setText('#trend24', '—');
  setText('#chartUpdated', '—');
  setText('#chartFootnote', `Moving average ${state.window} jam · data historis Open-Meteo`);
  setText('#chartSummary', 'Memuat grafik kualitas udara.');
  setText('#windowLabel', `${state.window} jam`);
  setText('#windowText', `${state.window} jam`);
  const adviceList = $('#adviceList');
  if (adviceList) adviceList.innerHTML = '';
  const adviceIconUse = $('#adviceIcon use');
  if (adviceIconUse) adviceIconUse.setAttribute('href', '#i-leaf');

  renderPollutantsSkeleton();
  renderForecastSkeleton();
  state.chart = null;
  drawChart(null);
  updateGaugeDot(0, true);
}

function renderErrorState() {
  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };
  setText('#ispuBadge', 'Gagal memuat');
  setText('#adviceTitle', 'Data belum tersedia');
  setText('#adviceText', 'Tekan tombol perbarui atau coba lagi untuk mengambil data kualitas udara.');
  setText('#heroSummary', 'Data kualitas udara belum bisa dimuat. Periksa koneksi internet, lalu coba lagi.');
  setText('#pollutantHint', 'Tidak ada data');
  setText('#chartSummary', 'Grafik tidak tersedia karena data gagal dimuat.');
  state.chart = null;
  drawChart(null);
}

/* ---------- City rail & overview skeleton ---------- */
function renderCityRail() {
  const rail = $('#cityRail');
  if (!rail) return;
  rail.innerHTML = CITIES.map((city) => `
    <button class="city-pill${city.id === state.city.id ? ' is-active' : ''}" type="button"
      data-city="${city.id}" aria-pressed="${city.id === state.city.id}">
      <span class="pill-dot"></span>${escapeHtml(city.name)}
    </button>
  `).join('');
}

function updateCityPills() {
  $$('#cityRail .city-pill').forEach((button) => {
    const isActive = button.dataset.city === state.city.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    const data = state.overview?.find((item) => item.city.id === button.dataset.city);
    CATEGORY_CLASSES.forEach((className) => button.classList.remove(className));
    if (data && Number.isFinite(data.pm25)) {
      const kategori = getKategori(hitungSubIndeks('pm2_5', data.pm25));
      button.classList.add(`cat-${kategori.slug}`);
    }
  });
}

const CITY_NOTE_HTML = `
  <article class="city-note-card" aria-label="Catatan data kota">
    <span class="card-kicker"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>Catatan data</span>
    <p><strong>Kartu kota</strong> memakai konsentrasi PM2.5 saat ini, sedangkan Ringkasan memakai estimasi ISPU dari rata-rata 24 jam semua polutan.</p>
    <ul class="city-note-list">
      <li><span class="status-dot"></span>Warna kartu mengikuti kategori ISPU.</li>
      <li><span class="status-dot"></span>Klik kartu untuk membuka detail kota.</li>
    </ul>
    <span class="city-note-source">Sumber: Open-Meteo Air Quality API</span>
  </article>
`;

function renderCityCardsSkeleton() {
  const grid = $('#cityGrid');
  if (!grid) return;
  grid.innerHTML = CITIES.map((city) => `
    <button class="city-card city-skeleton" type="button" data-city="${city.id}" disabled>
      <div class="city-card-top">
        <div>
          <h3>${escapeHtml(city.name)}</h3>
          <p>${escapeHtml(city.province)}</p>
        </div>
        <span class="city-arrow"><svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg></span>
      </div>
      <div class="city-card-main">
        <div class="city-pm"><strong>—</strong><span>µg/m³</span></div>
        <span class="badge cat-baik">Memuat…</span>
      </div>
      <div class="city-card-bar"><span style="width: 0"></span></div>
      <div class="city-card-foot"><span>PM2.5 saat ini</span><span>—</span></div>
    </button>
  `).join('') + CITY_NOTE_HTML;
  renderCityCompareSkeleton();
}

/* ---------- One-screen views ---------- */
function viewFromHash() {
  const id = window.location.hash.replace(/^#/, '');
  return VIEWS.includes(id) ? id : 'ringkasan';
}

function showView(id, options = {}) {
  const next = VIEWS.includes(id) ? id : 'ringkasan';
  const changed = currentView !== next;
  currentView = next;

  VIEWS.forEach((viewId) => {
    const section = document.getElementById(viewId);
    if (!section) return;
    const active = viewId === next;
    section.hidden = !active;
    section.classList.toggle('is-active', active);
    if (active) {
      section.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
    }
  });

  $$('.main-nav .nav-link').forEach((link) => {
    const target = link.dataset.view || link.getAttribute('href')?.slice(1);
    const active = target === next;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (options.updateHash) {
    const hash = `#${next}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ view: next }, '', hash);
    }
  }

  if (next === 'prediksi') {
    window.requestAnimationFrame(() => {
      if (state.chart) drawChart(state.chartHover);
      else drawChartEmpty(state.loading ? 'Memuat grafik…' : 'Data grafik belum tersedia');
    });
  }

  if (changed && window.matchMedia('(max-width: 980px)').matches) {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
}

function setupViewTabs() {
  $$('.main-nav .nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = link.dataset.view || link.getAttribute('href')?.slice(1);
      if (!id) return;
      if (id === currentView) {
        if (window.matchMedia('(max-width: 980px)').matches) {
          window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        }
        return;
      }
      showView(id, { updateHash: true });
    });
  });

  window.addEventListener('popstate', () => showView(viewFromHash()));
  window.addEventListener('hashchange', () => showView(viewFromHash()));
  showView(viewFromHash());
}

function setupFullscreen() {
  const button = $('#fullscreenBtn');
  if (!button) return;

  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
    button.hidden = true;
    return;
  }

  const sync = () => {
    const active = Boolean(document.fullscreenElement);
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', active ? '#i-minimize' : '#i-maximize');
    button.setAttribute('aria-label', active ? 'Keluar dari layar penuh' : 'Masuk layar penuh');
    button.setAttribute('title', active ? 'Keluar layar penuh' : 'Layar penuh');
    button.classList.toggle('is-active', active);
  };

  button.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showToast('Layar penuh tidak tersedia di browser ini', 'i-alert');
    }
  });

  document.addEventListener('fullscreenchange', sync);
  sync();
}

/* ---------- Events & init ---------- */
function setupEvents() {
  $('#cityRail')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-city]');
    if (!button) return;
    selectCity(button.dataset.city, { scroll: false });
  });

  $('#cityGrid')?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-city]');
    if (!card) return;
    selectCity(card.dataset.city, { scroll: true });
  });

  $('#cityCompare')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-city]');
    if (!row) return;
    selectCity(row.dataset.city, { scroll: true });
  });

  $('#refreshBtn')?.addEventListener('click', () => {
    loadCityData(state.city, { force: true, toast: true });
  });

  $('#retryBtn')?.addEventListener('click', () => {
    loadCityData(state.city, { force: true });
  });

  $('#closeError')?.addEventListener('click', hideError);

  $('#windowSelector')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-window]');
    if (!button) return;
    const nextWindow = Number(button.dataset.window);
    if (!Number.isFinite(nextWindow) || nextWindow === state.window) return;
    state.window = nextWindow;
    $$('#windowSelector button').forEach((item) => {
      const active = Number(item.dataset.window) === nextWindow;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (state.data) renderPrediction(state.data);
  });

  const header = $('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  setupViewTabs();
  setupFullscreen();
  setupReveal();
  setupChartResize();
  setupChartInteractions();
}

function setupReveal() {
  const items = $$('.reveal');
  if (!items.length) return;
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((item) => observer.observe(item));
}

function setupChartResize() {
  const wrap = $('#chartWrap');
  if (!wrap) return;
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (state.chart) window.requestAnimationFrame(() => drawChart(state.chartHover));
    });
    observer.observe(wrap);
  } else {
    window.addEventListener('resize', () => {
      if (state.chart) drawChart(state.chartHover);
    });
  }
}

async function init() {
  setupTheme();
  state.city = readInitialCity();
  updateCityIdentity();
  renderCityRail();
  renderCityCardsSkeleton();
  renderPollutantsSkeleton();
  renderForecastSkeleton();
  setupEvents();
  applyTheme(document.documentElement.dataset.theme);
  await Promise.allSettled([
    loadCityData(state.city),
    loadOverview()
  ]);

  window.setInterval(() => {
    if (document.hidden || state.loading || state.request) return;
    loadCityData(state.city, { silent: true });
    loadOverview();
  }, 10 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

/* =========================================================
   PERHITUNGAN ISPU
   Tabel konversi mengikuti Permen LHK No. 14 Tahun 2020.
   ========================================================= */
function hitungSubIndeks(pollutantKey, concentration) {
  const angka = Number(concentration);
  if (!Number.isFinite(angka)) return 0;

  const polutan = POLLUTANT_BY_KEY[pollutantKey];
  if (!polutan) return 0;

  const nilai = Math.max(0, angka);
  let batasBawahKonsentrasi = 0;
  let indeksBawah = 0;

  for (let i = 0; i < polutan.breakpoints.length; i += 1) {
    const batasAtasKonsentrasi = polutan.breakpoints[i];
    const indeksAtas = ISPU_INDEX_LEVELS[i + 1];

    if (nilai <= batasAtasKonsentrasi) {
      const selisihKonsentrasi = batasAtasKonsentrasi - batasBawahKonsentrasi;
      if (selisihKonsentrasi <= 0) return indeksAtas;
      const hasil = indeksBawah
        + ((indeksAtas - indeksBawah) / selisihKonsentrasi) * (nilai - batasBawahKonsentrasi);
      return clamp(hasil, 0, 500);
    }

    batasBawahKonsentrasi = batasAtasKonsentrasi;
    indeksBawah = indeksAtas;
  }

  return 500;
}

function hitungMovingAverage(values, windowSize, steps) {
  const seed = values.filter((value) => Number.isFinite(value));
  if (!seed.length) return [];
  const n = Math.max(1, Math.min(windowSize, seed.length));
  const working = [...seed];
  const predictions = [];

  for (let step = 0; step < steps; step += 1) {
    const slice = working.slice(-n);
    const average = mean(slice) ?? 0;
    predictions.push(average);
    working.push(average);
  }
  return predictions;
}

function hitungTren(values) {
  const data = values.filter((value) => Number.isFinite(value));
  if (data.length < 3) return { direction: 'stabil', percent: 0 };

  const n = data.length;
  const jumlahX = (n * (n - 1)) / 2;
  const jumlahY = data.reduce((total, value) => total + value, 0);
  let jumlahXY = 0;
  let jumlahXX = 0;

  data.forEach((value, index) => {
    jumlahXY += index * value;
    jumlahXX += index * index;
  });

  const penyebut = n * jumlahXX - jumlahX * jumlahX;
  const slope = penyebut === 0 ? 0 : (n * jumlahXY - jumlahX * jumlahY) / penyebut;
  const rataRata = jumlahY / n;
  const perubahanPerHari = rataRata > 0 ? (slope * 24 / rataRata) * 100 : 0;

  if (perubahanPerHari > 3) return { direction: 'naik', percent: Math.abs(perubahanPerHari) };
  if (perubahanPerHari < -3) return { direction: 'turun', percent: Math.abs(perubahanPerHari) };
  return { direction: 'stabil', percent: Math.abs(perubahanPerHari) };
}

function addDays(dateKey, offset) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

/* =========================================================
   NORMALISASI RESPONS API
   ========================================================= */
function normalizeCityData(raw, city) {
  const currentTime = raw.current?.time;
  const times = raw.hourly?.time || [];
  let currentIndex = times.indexOf(currentTime);

  if (currentIndex === -1) {
    currentIndex = times.length - 1;
    for (let i = 0; i < times.length; i += 1) {
      if (times[i] <= currentTime) currentIndex = i;
      else break;
    }
  }
  currentIndex = clamp(currentIndex, 0, Math.max(0, times.length - 1));

  const startIndex = Math.max(0, currentIndex - 23);
  const historyTimes = times.slice(startIndex, currentIndex + 1);
  const futureTimes = times.slice(currentIndex + 1, currentIndex + 25);

  const pollutants = {};
  let dominantKey = 'pm2_5';
  let highestIndex = -1;

  POLLUTANTS.forEach((polutan) => {
    const hourlyValues = Array.isArray(raw.hourly?.[polutan.key])
      ? raw.hourly[polutan.key]
      : [];
    const historyValues = hourlyValues.slice(startIndex, currentIndex + 1);
    const average24 = mean(historyValues);
    const fallback = Number(raw.current?.[polutan.key]);
    const nilaiRataRata = average24 ?? (Number.isFinite(fallback) ? fallback : 0);
    const subIndeks = Math.round(hitungSubIndeks(polutan.key, nilaiRataRata));
    const currentValue = Number(raw.current?.[polutan.key]);

    pollutants[polutan.key] = {
      current: Number.isFinite(currentValue) ? currentValue : null,
      average24: Number.isFinite(average24) ? average24 : null,
      subIndeks,
      kategori: getKategori(subIndeks),
      history: historyValues
    };

    if (subIndeks > highestIndex) {
      highestIndex = subIndeks;
      dominantKey = polutan.key;
    }
  });

  const pmHistoryValues = Array.isArray(raw.hourly?.pm2_5) ? raw.hourly.pm2_5 : [];
  const pastSeries = historyTimes.map((time, index) => ({
    time,
    value: Number.isFinite(pmHistoryValues[startIndex + index])
      ? pmHistoryValues[startIndex + index]
      : null
  }));

  const futureSeries = futureTimes.map((time, index) => ({
    time,
    value: Number.isFinite(pmHistoryValues[currentIndex + 1 + index])
      ? pmHistoryValues[currentIndex + 1 + index]
      : null
  }));

  const ispu = Math.max(0, Math.round(pollutants[dominantKey].subIndeks));
  const kategori = getKategori(ispu);

  return {
    city,
    currentTime,
    timezone: raw.timezone,
    timezoneAbbr: getTimeZoneLabel(raw.utc_offset_seconds),
    utcOffsetSeconds: raw.utc_offset_seconds,
    usAqi: Number.isFinite(Number(raw.current?.us_aqi)) ? Number(raw.current.us_aqi) : null,
    pollutants,
    dominantKey,
    ispu,
    kategori,
    pastSeries,
    futureSeries,
    daily: buildDailyForecast(raw.hourly, currentTime),
    fetchedAt: new Date()
  };
}

function buildDailyForecast(hourly, currentTime) {
  const times = hourly?.time || [];
  const pmValues = hourly?.pm2_5 || [];
  const currentDateKey = String(currentTime).slice(0, 10);
  const days = [];

  for (let offset = 0; offset < 5; offset += 1) {
    const dateKey = addDays(currentDateKey, offset);
    const nilaiHarian = [];

    for (let i = 0; i < times.length; i += 1) {
      if (!String(times[i]).startsWith(dateKey)) continue;
      if (offset === 0 && times[i] < currentTime) continue;
      if (Number.isFinite(pmValues[i])) nilaiHarian.push(pmValues[i]);
    }

    if (offset === 0 && nilaiHarian.length < 3) {
      nilaiHarian.length = 0;
      for (let i = 0; i < times.length; i += 1) {
        if (String(times[i]).startsWith(dateKey) && Number.isFinite(pmValues[i])) {
          nilaiHarian.push(pmValues[i]);
        }
      }
    }

    const average = mean(nilaiHarian);
    const maximum = nilaiHarian.length ? Math.max(...nilaiHarian) : null;
    const ispu = average === null ? null : Math.round(hitungSubIndeks('pm2_5', average));
    let label = '';

    if (offset === 0) label = 'Hari ini';
    else if (offset === 1) label = 'Besok';
    else label = formatHari(`${dateKey}T12:00`);

    days.push({
      dateKey,
      label,
      average,
      maximum,
      ispu,
      kategori: ispu === null ? getKategori(0) : getKategori(ispu)
    });
  }

  return days;
}

/* =========================================================
   RENDER DASHBOARD
   ========================================================= */
function renderDashboard(data) {
  const { city, kategori, ispu, pollutants, dominantKey, timezoneAbbr, currentTime } = data;
  const dominant = POLLUTANT_BY_KEY[dominantKey];
  const dominantData = pollutants[dominantKey];

  setCategoryClasses($('#gaugeCard'), kategori);
  setCategoryClasses($('#adviceCard'), kategori);
  setCategoryClasses($('#ispuBadge'), kategori);
  setCategoryClasses($('#adviceBadge'), kategori);
  setCategoryClasses($('#predictionCategory'), kategori);
  setCategoryClasses($('.prediction-summary'), kategori);

  animateNumber($('#ispuValue'), ispu, 0);
  animateNumber($('#usAqiValue'), data.usAqi, 0);

  const badge = $('#ispuBadge');
  if (badge) badge.textContent = kategori.label;

  const range = $('#ispuRange');
  if (range) range.textContent = `Rentang ISPU ${kategori.range}`;

  const heroDate = $('#heroDate');
  if (heroDate) heroDate.textContent = formatTanggalLengkap(currentTime);

  const updated = $('#updatedTime');
  if (updated) updated.textContent = `${formatTanggalPendek(currentTime)} · ${formatJam(currentTime)} ${timezoneAbbr}`;

  const timestamp = $('#dataTimestamp');
  if (timestamp) timestamp.textContent = `Data pukul ${formatJam(currentTime)} ${timezoneAbbr}`;

  const summary = $('#heroSummary');
  if (summary) summary.textContent = kategori.hero.replaceAll('{city}', city.name);

  const dominantName = $('#dominantPollutant');
  if (dominantName) dominantName.textContent = `${dominant.label} · ${kategori.label}`;

  const dominantValue = $('#dominantValue');
  if (dominantValue) {
    const nilai = dominantData.average24;
    dominantValue.textContent = Number.isFinite(nilai)
      ? `${formatNumber(nilai, dominant.digits)} ${dominant.unit}`
      : '—';
  }

  const gaugeDesc = $('#gaugeDesc');
  if (gaugeDesc) {
    gaugeDesc.textContent = `Estimasi ISPU ${ispu}, kategori ${kategori.label}. Dihitung dari rata-rata 24 jam polutan.`;
  }

  const adviceBadge = $('#adviceBadge');
  if (adviceBadge) adviceBadge.textContent = kategori.label;

  const adviceTitle = $('#adviceTitle');
  if (adviceTitle) adviceTitle.textContent = kategori.title;

  const adviceText = $('#adviceText');
  if (adviceText) adviceText.textContent = kategori.text.replaceAll('{city}', city.name);

  const adviceIconUse = $('#adviceIcon use');
  if (adviceIconUse) adviceIconUse.setAttribute('href', `#${kategori.icon}`);

  const adviceList = $('#adviceList');
  if (adviceList) {
    adviceList.innerHTML = kategori.tips.map((tip) => `
      <li>
        <span class="check"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>
        <span>${escapeHtml(tip)}</span>
      </li>
    `).join('');
  }

  const adviceNote = $('#adviceNote');
  if (adviceNote) adviceNote.textContent = `Estimasi ISPU ${ispu} · ${kategori.range}`;

  const adviceCity = $('#adviceCity');
  if (adviceCity) adviceCity.textContent = city.name;

  const pollutantHint = $('#pollutantHint');
  if (pollutantHint) pollutantHint.textContent = `Diperbarui ${formatJam(currentTime)} ${timezoneAbbr}`;

  const heroCity = $('#heroCity');
  if (heroCity) heroCity.textContent = city.name;

  const heroCoords = $('#heroCoords');
  if (heroCoords) heroCoords.textContent = formatKoordinat(city.lat, city.lon);

  document.title = `Udara ${city.name} · ISPU ${ispu} | udara.`;

  renderPollutants(data);
  renderPrediction(data);
  renderForecast(data);
  renderCityCards();
  updateCityPills();
  updateGaugeDot(ispu, false);
}

/* =========================================================
   RENDER KARTU POLUTAN
   ========================================================= */
function buatSparkline(values) {
  const points = [];
  const length = values.length || 1;
  const numeric = values.map((value) => (Number.isFinite(value) ? value : null));
  const valid = numeric.filter((value) => value !== null);

  if (valid.length < 2) {
    return `<svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <path class="spark-line" d="M0 20 L100 20" opacity="0.25"/>
    </svg>`;
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  numeric.forEach((value, index) => {
    if (value === null) return;
    const x = length === 1 ? 0 : (index / (length - 1)) * width;
    const y = height - 3 - ((value - min) / range) * (height - 6);
    points.push([x, y]);
  });

  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${path} L100 30 L0 30 Z`;

  return `<svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
    <path class="spark-area" d="${area}"/>
    <path class="spark-line" d="${path}"/>
  </svg>`;
}

function renderPollutantCard(polutan, data) {
  const kategori = data ? data.kategori : getKategori(0);
  const subIndeks = data ? data.subIndeks : null;
  const current = data?.current;
  const history = data?.history || [];
  const valueText = Number.isFinite(current) ? formatNumber(current, polutan.digits) : '—';
  const subText = Number.isFinite(subIndeks) ? String(subIndeks) : '—';
  const spark = data ? buatSparkline(history) : buatSparkline([]);
  const label = data ? kategori.label : 'Memuat data';
  const title = `${polutan.name}. ${polutan.description} Konsentrasi saat ini ${valueText} ${polutan.unit}. ISPU 24 jam ${subText}.`;

  return `
    <article class="pollutant-card cat-${kategori.slug}${data ? '' : ' pollutant-skeleton'}"
      data-pollutant="${polutan.key}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
      <div class="pollutant-head">
        <span class="pollutant-icon"><svg class="icon" aria-hidden="true"><use href="#${polutan.icon}"/></svg></span>
        <span class="pollutant-name">${polutan.label}</span>
        <span class="pollutant-index" title="Estimasi ISPU dari rata-rata 24 jam">${subText}</span>
      </div>
      <div class="pollutant-value"><strong>${valueText}</strong><span>${polutan.unit}</span></div>
      <div class="pollutant-spark">${spark}</div>
      <div class="pollutant-foot">
        <span class="status-dot"></span>
        <span class="cat-text">${label}</span>
        <span>·</span>
        <span>ISPU 24 j</span>
      </div>
    </article>
  `;
}

function renderPollutants(data) {
  const grid = $('#pollutantGrid');
  if (!grid) return;
  grid.innerHTML = POLLUTANTS.map((polutan) => {
    const item = data?.pollutants?.[polutan.key] || null;
    return renderPollutantCard(polutan, item);
  }).join('');
}

function renderPollutantsSkeleton() {
  const grid = $('#pollutantGrid');
  if (!grid) return;
  grid.innerHTML = POLLUTANTS.map((polutan) => renderPollutantCard(polutan, null)).join('');
}

/* =========================================================
   RENDER KARTU KOTA
   ========================================================= */
function renderCityCompareSkeleton() {
  const list = $('#cityCompare');
  if (!list) return;
  list.innerHTML = CITIES.map((city, index) => `
    <div class="compare-row compare-skeleton" aria-hidden="true">
      <span class="compare-rank">${index + 1}</span>
      <span class="compare-city">${escapeHtml(city.name)}<small>${escapeHtml(city.province)}</small></span>
      <span class="compare-track"><span style="width:0%"></span></span>
      <span class="compare-value">— <small>µg/m³</small></span>
      <span class="badge">Memuat</span>
    </div>
  `).join('');
}

function renderCityCompare() {
  const list = $('#cityCompare');
  if (!list) return;

  if (!state.overview) {
    renderCityCompareSkeleton();
    return;
  }

  const rows = [...state.overview].sort((a, b) => {
    const first = Number.isFinite(a.pm25) ? a.pm25 : -Infinity;
    const second = Number.isFinite(b.pm25) ? b.pm25 : -Infinity;
    return second - first;
  });
  const maxPm = rows.reduce((max, item) => (
    Number.isFinite(item.pm25) ? Math.max(max, item.pm25) : max
  ), 1);

  list.innerHTML = rows.map(({ city, pm25 }, index) => {
    const hasValue = Number.isFinite(pm25);
    const ispu = hasValue ? Math.round(hitungSubIndeks('pm2_5', pm25)) : null;
    const kategori = hasValue ? getKategori(ispu) : null;
    const isCurrent = city.id === state.city.id;
    const width = hasValue ? clamp((pm25 / maxPm) * 100, 4, 100) : 0;
    const classKategori = kategori ? `cat-${kategori.slug}` : '';
    const valueText = hasValue ? formatNumber(pm25, 1) : 'belum tersedia';

    return `
      <button class="compare-row ${classKategori}${isCurrent ? ' is-current' : ''}" type="button"
        data-city="${city.id}" ${isCurrent ? 'aria-current="true"' : ''}
        aria-label="${escapeHtml(city.name)}, peringkat ${index + 1}, PM2.5 ${valueText} mikrogram per meter kubik, kategori ${kategori ? kategori.label : 'belum tersedia'}. Klik untuk melihat detail.">
        <span class="compare-rank">${index + 1}</span>
        <span class="compare-city">${escapeHtml(city.name)}<small>${escapeHtml(city.province)}</small></span>
        <span class="compare-track"><span style="width:${width}%"></span></span>
        <span class="compare-value">${hasValue ? formatNumber(pm25, 1) : '—'} <small>µg/m³</small></span>
        <span class="badge">${kategori ? kategori.label : '—'}</span>
      </button>
    `;
  }).join('');
}

function renderCityCards() {
  const grid = $('#cityGrid');
  if (!grid) return;

  if (!state.overview) {
    renderCityCardsSkeleton();
    return;
  }

  const values = state.overview
    .map((item) => item.pm25)
    .filter((value) => Number.isFinite(value));
  const maxPm = values.length ? Math.max(...values) : 1;

  grid.innerHTML = state.overview.map(({ city, pm25 }) => {
    const hasValue = Number.isFinite(pm25);
    const ispu = hasValue ? Math.round(hitungSubIndeks('pm2_5', pm25)) : null;
    const kategori = hasValue ? getKategori(ispu) : null;
    const isCurrent = city.id === state.city.id;
    const relative = hasValue ? clamp((pm25 / maxPm) * 100, 4, 100) : 0;
    const classKategori = kategori ? `cat-${kategori.slug}` : '';

    return `
      <button class="city-card ${classKategori}${isCurrent ? ' is-current' : ''}" type="button"
        data-city="${city.id}" ${isCurrent ? 'aria-current="true"' : ''}
        aria-label="${escapeHtml(city.name)}, PM2.5 ${hasValue ? formatNumber(pm25, 1) : 'belum tersedia'} mikrogram per meter kubik. Klik untuk melihat detail.">
        <div class="city-card-top">
          <div>
            <h3>${escapeHtml(city.name)}</h3>
            <p>${escapeHtml(city.province)}</p>
          </div>
          ${isCurrent
            ? '<span class="current-label">Dipilih</span>'
            : '<span class="city-arrow"><svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg></span>'}
        </div>
        <div class="city-card-main">
          <div class="city-pm"><strong>${hasValue ? formatNumber(pm25, 1) : '—'}</strong><span>µg/m³</span></div>
          ${kategori ? `<span class="badge">${kategori.label}</span>` : '<span class="badge">—</span>'}
        </div>
        <div class="city-card-bar"><span style="width:${relative}%"></span></div>
        <div class="city-card-foot">
          <span>PM2.5 saat ini</span>
          <span>${hasValue ? `ISPU <strong>${ispu}</strong>` : 'Menunggu data'}</span>
        </div>
      </button>
    `;
  }).join('') + CITY_NOTE_HTML;
  renderCityCompare();
}

/* =========================================================
   GAUGE
   ========================================================= */
function gaugeProgressFromValue(value) {
  const angka = clamp(Number(value) || 0, 0, 500);
  if (angka <= 50) return (angka / 50) * 0.2;
  if (angka <= 100) return 0.2 + ((angka - 50) / 50) * 0.2;
  if (angka <= 200) return 0.4 + ((angka - 100) / 100) * 0.2;
  if (angka <= 300) return 0.6 + ((angka - 200) / 100) * 0.2;
  return 0.8 + ((angka - 300) / 200) * 0.2;
}

function gaugePoint(progress) {
  const angle = Math.PI - clamp(progress, 0, 1) * Math.PI;
  const centerX = 180;
  const centerY = 190;
  const radius = 130;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY - Math.sin(angle) * radius
  };
}

function updateGaugeDot(value, immediate = false) {
  const dot = $('#gaugeDot');
  const halo = $('#gaugeDotHalo');
  if (!dot || !halo) return;

  const target = gaugeProgressFromValue(value);
  const start = state.gaugeProgress;
  cancelAnimationFrame(state.gaugeAnimation);

  const paint = (progress) => {
    const point = gaugePoint(progress);
    dot.setAttribute('cx', point.x.toFixed(2));
    dot.setAttribute('cy', point.y.toFixed(2));
    halo.setAttribute('cx', point.x.toFixed(2));
    halo.setAttribute('cy', point.y.toFixed(2));
    state.gaugeProgress = progress;
  };

  if (immediate || reducedMotion.matches) {
    paint(target);
    return;
  }

  const duration = 850;
  const started = performance.now();
  const tick = (now) => {
    const progress = clamp((now - started) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    paint(start + (target - start) * eased);
    if (progress < 1) {
      state.gaugeAnimation = requestAnimationFrame(tick);
    }
  };
  state.gaugeAnimation = requestAnimationFrame(tick);
}

/* =========================================================
   PREDIKSI & PRAKIRAAN
   ========================================================= */
function renderPrediction(data) {
  const seed = data.pastSeries
    .map((point) => point.value)
    .filter((value) => Number.isFinite(value));

  const windowSize = Math.max(1, Math.min(state.window, seed.length));
  const predictions = hitungMovingAverage(seed, windowSize, 24);
  const futureTimes = data.futureSeries.map((point) => point.time).slice(0, predictions.length);

  const windowLabel = $('#windowLabel');
  if (windowLabel) windowLabel.textContent = `${state.window} jam`;

  const windowText = $('#windowText');
  if (windowText) windowText.textContent = `${state.window} jam`;

  const chartFootnote = $('#chartFootnote');
  if (chartFootnote) chartFootnote.textContent = `Moving average ${state.window} jam · data historis Open-Meteo`;

  if (!predictions.length) {
    const avg = $('#predictionAvg');
    if (avg) {
      avg.textContent = '—';
      avg.removeAttribute('data-value');
    }
    const badge = $('#predictionCategory');
    if (badge) badge.textContent = '—';
    const note = $('#predictionTrendText');
    if (note) note.textContent = 'Data historis belum cukup untuk memprediksi.';
    state.chart = null;
    drawChart(null);
    return;
  }

  const predictionAverage = mean(predictions) ?? 0;
  const actualAverage = mean(seed);
  const predictionIspu = Math.round(hitungSubIndeks('pm2_5', predictionAverage));
  const predictionKategori = getKategori(predictionIspu);
  const delta = actualAverage > 0 ? ((predictionAverage - actualAverage) / actualAverage) * 100 : 0;
  const trendType = delta > 3 ? 'naik' : delta < -3 ? 'turun' : 'stabil';
  const trend24 = hitungTren(seed);

  setCategoryClasses($('#predictionCategory'), predictionKategori);
  setCategoryClasses($('.prediction-summary'), predictionKategori);

  const categoryBadge = $('#predictionCategory');
  if (categoryBadge) categoryBadge.textContent = predictionKategori.label;

  animateNumber($('#predictionAvg'), predictionAverage, 1);

  const actualAvgElement = $('#actualAvg');
  if (actualAvgElement) {
    actualAvgElement.textContent = Number.isFinite(actualAverage)
      ? `${formatNumber(actualAverage, 1)} µg/m³`
      : '—';
  }

  const trendPill = $('#predictionTrend');
  if (trendPill) {
    trendPill.classList.remove('trend-naik', 'trend-turun', 'trend-stabil');
    trendPill.classList.add(`trend-${trendType}`);
    const iconUse = trendPill.querySelector('use');
    if (iconUse) {
      const iconId = trendType === 'naik' ? 'i-trend-up' : trendType === 'turun' ? 'i-trend-down' : 'i-minus';
      iconUse.setAttribute('href', `#${iconId}`);
    }
  }

  const trendText = $('#predictionTrendText');
  if (trendText) {
    const percent = formatNumber(Math.abs(delta), 1);
    if (trendType === 'naik') trendText.textContent = `Naik ${percent}% dari 24 jam terakhir`;
    else if (trendType === 'turun') trendText.textContent = `Turun ${percent}% dari 24 jam terakhir`;
    else trendText.textContent = 'Relatif stabil dibanding 24 jam terakhir';
  }

  const peak = Math.max(...predictions);
  const peakIndex = predictions.indexOf(peak);
  const peakElement = $('#peakPrediction');
  if (peakElement) peakElement.textContent = `${formatNumber(peak, 1)} µg/m³`;
  const peakTimeElement = $('#peakTime');
  if (peakTimeElement) {
    const time = futureTimes[peakIndex];
    peakTimeElement.textContent = time
      ? `${formatJam(time)} · ${formatTanggalPendek(time)}`
      : '—';
  }

  const trendElement = $('#trend24');
  if (trendElement) {
    trendElement.classList.remove('is-naik', 'is-turun', 'is-stabil');
    trendElement.classList.add(`is-${trend24.direction}`);
    const directionText = trend24.direction === 'naik'
      ? 'Naik'
      : trend24.direction === 'turun'
        ? 'Turun'
        : 'Stabil';
    trendElement.textContent = trend24.direction === 'stabil'
      ? 'Stabil'
      : `${directionText} ${formatNumber(trend24.percent, 1)}%/hari`;
  }

  const chartUpdated = $('#chartUpdated');
  if (chartUpdated) {
    chartUpdated.textContent = `Analisis ${formatJam(data.currentTime)} ${data.timezoneAbbr}`;
  }

  state.chart = {
    actual: data.pastSeries.map((point) => ({ ...point })),
    predicted: predictions.map((value, index) => ({
      time: futureTimes[index] || '',
      value
    })),
    window: state.window,
    currentDateKey: String(data.currentTime).slice(0, 10)
  };
  state.chartHover = null;

  const chartCanvas = $('#predictionChart');
  if (chartCanvas) {
    chartCanvas.setAttribute('aria-label',
      `Grafik konsentrasi PM2.5 24 jam terakhir dan prediksi moving average ${state.window} jam untuk 24 jam ke depan. Gunakan tombol panah untuk menjelajahi titik data.`);
  }

  const chartSummary = $('#chartSummary');
  if (chartSummary) {
    chartSummary.textContent = `Rata-rata PM2.5 24 jam terakhir ${formatNumber(actualAverage, 1)} mikrogram per meter kubik. Prediksi 24 jam ke depan rata-rata ${formatNumber(predictionAverage, 1)} mikrogram per meter kubik, kategori ${predictionKategori.label}, dengan tren ${trendType}. Puncak prediksi ${formatNumber(peak, 1)} mikrogram per meter kubik.`;
  }

  drawChart(null);
}

function renderForecast(data) {
  const strip = $('#forecastStrip');
  if (!strip) return;

  strip.innerHTML = data.daily.map((day) => {
    const kategori = day.kategori;
    const ispuText = Number.isFinite(day.ispu) ? String(day.ispu) : '—';
    const averageText = Number.isFinite(day.average) ? formatNumber(day.average, 1) : '—';
    const width = Number.isFinite(day.ispu) ? clamp((day.ispu / 300) * 100, 3, 100) : 0;
    const categoryClass = `cat-${kategori.slug}`;

    return `
      <article class="forecast-card ${categoryClass}"
        aria-label="${escapeHtml(day.label)}, ${escapeHtml(formatTanggalPendek(`${day.dateKey}T12:00`))}. Estimasi ISPU ${ispuText}, rata-rata PM2.5 ${averageText} mikrogram per meter kubik.">
        <div class="forecast-day">${escapeHtml(day.label)}<span>${escapeHtml(formatTanggalPendek(`${day.dateKey}T12:00`))}</span></div>
        <div class="forecast-value-row">
          <strong class="forecast-ispu">${ispuText}</strong>
          <span class="forecast-unit">ISPU</span>
        </div>
        <span class="badge">${kategori.label}</span>
        <div class="forecast-bar"><span style="width:${width}%"></span></div>
        <div class="forecast-pm">Rata-rata PM2.5 <strong>${averageText} µg/m³</strong></div>
      </article>
    `;
  }).join('');
}

function renderForecastSkeleton() {
  const strip = $('#forecastStrip');
  if (!strip) return;
  const labels = ['Hari ini', 'Besok', 'Lusa', 'H+3', 'H+4'];

  strip.innerHTML = labels.map((label) => `
    <article class="forecast-card cat-baik forecast-skeleton">
      <div class="forecast-day">${label}<span>—</span></div>
      <div class="forecast-value-row">
        <strong class="forecast-ispu">—</strong>
        <span class="forecast-unit">ISPU</span>
      </div>
      <span class="badge">Memuat…</span>
      <div class="forecast-bar"><span style="width:0%"></span></div>
      <div class="forecast-pm">Rata-rata PM2.5 <strong>—</strong></div>
    </article>
  `).join('');
}

/* =========================================================
   GRAFIK CANVAS
   ========================================================= */
const CHART_PADDING = { top: 34, right: 16, bottom: 34, left: 46 };

function chartColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    actual: read('--chart-actual', '#0e9f7f'),
    predicted: read('--chart-predicted', '#d97706'),
    grid: read('--chart-grid', 'rgba(11,51,40,0.09)'),
    label: read('--chart-label', '#728b84'),
    surface: read('--surface-solid', '#ffffff'),
    text: read('--text', '#0b1f1a'),
    border: read('--border-strong', 'rgba(11,51,40,0.16)')
  };
}

function hitungSkalaGrafik(maxValue) {
  const raw = Math.max(10, maxValue * 1.08);
  const rough = raw / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const factors = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const factor = factors.find((item) => normalized <= item) || 10;
  const step = factor * magnitude;
  return {
    max: Math.ceil(raw / step) * step,
    step
  };
}

function drawChartEmpty(message) {
  const canvas = $('#predictionChart');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  const colors = chartColors();

  ctx.fillStyle = colors.label;
  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, rect.width / 2, rect.height / 2);
  state.chartLayout = null;
}

function drawChart(hoverIndex = null) {
  const canvas = $('#predictionChart');
  if (!canvas) return;

  if (!state.chart) {
    drawChartEmpty(state.loading ? 'Memuat grafik…' : 'Data grafik belum tersedia');
    return;
  }

  const actual = state.chart.actual || [];
  const predicted = state.chart.predicted || [];
  if (!actual.length && !predicted.length) {
    drawChartEmpty('Data grafik belum tersedia');
    return;
  }

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 30 || rect.height < 30) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const colors = chartColors();
  const width = rect.width;
  const height = rect.height;
  const pad = CHART_PADDING;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const a = actual.length;
  const p = predicted.length;
  const n = a + p;
  if (n < 2 || plotW <= 0 || plotH <= 0) return;

  const allTimes = [
    ...actual.map((point) => point.time),
    ...predicted.map((point) => point.time)
  ];

  const validValues = [
    ...actual.map((point) => point.value),
    ...predicted.map((point) => point.value)
  ].filter((value) => Number.isFinite(value));

  if (!validValues.length) {
    drawChartEmpty('Data PM2.5 belum tersedia');
    return;
  }

  const scale = hitungSkalaGrafik(Math.max(...validValues));
  const xAt = (index) => pad.left + (index / (n - 1)) * plotW;
  const yAt = (value) => pad.top + plotH - (clamp(value, 0, scale.max) / scale.max) * plotH;
  const xNow = xAt(Math.max(0, a - 1));

  state.chartLayout = {
    width, height, plotW, plotH, n, a, p, xNow,
    top: pad.top,
    left: pad.left,
    right: pad.left + plotW,
    bottom: pad.top + plotH,
    scaleMax: scale.max
  };

  // Latar area prediksi
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = colors.predicted;
  ctx.fillRect(xNow, pad.top, Math.max(0, width - pad.right - xNow), plotH);
  ctx.restore();

  // Grid horizontal
  ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let value = 0; value <= scale.max + scale.step / 2; value += scale.step) {
    const y = yAt(value);
    ctx.beginPath();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = colors.label;
    ctx.fillText(formatNumber(value, 0), pad.left - 9, y);
  }

  // Label hari & garis tengah malam
  const groupStarts = [];
  let previousDate = '';
  allTimes.forEach((time, index) => {
    const dateKey = String(time).slice(0, 10);
    if (dateKey && dateKey !== previousDate) {
      groupStarts.push({ index, dateKey });
      previousDate = dateKey;
    }
  });

  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '0.08em';
  const currentDateKey = state.chart.currentDateKey;
  const dateToUtc = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  groupStarts.forEach((group, groupIndex) => {
    const next = groupStarts[groupIndex + 1];
    const groupWidth = ((next ? next.index : n) - group.index) * (plotW / (n - 1));
    if (groupIndex > 0) {
      const boundaryX = xAt(group.index);
      ctx.save();
      ctx.strokeStyle = colors.grid;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(boundaryX, pad.top - 7);
      ctx.lineTo(boundaryX, pad.top + plotH);
      ctx.stroke();
      ctx.restore();
    }
    if (groupWidth < 47) return;

    const diff = Math.round((dateToUtc(group.dateKey) - dateToUtc(currentDateKey)) / 86400000);
    let label = '';
    if (diff === -1) label = 'Kemarin';
    else if (diff === 0) label = 'Hari ini';
    else if (diff === 1) label = 'Besok';
    else if (diff === 2) label = 'Lusa';
    else label = formatHari(`${group.dateKey}T12:00`);

    ctx.fillStyle = colors.label;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label.toUpperCase(), xAt(group.index) + 2, pad.top - 12);
  });

  // Label jam
  const labelIndices = [];
  allTimes.forEach((time, index) => {
    const hour = Number(String(time).slice(11, 13));
    if (Number.isFinite(hour) && hour % 6 === 0) {
      const x = xAt(index);
      const last = labelIndices[labelIndices.length - 1];
      if (!last || x - last.x >= 58) labelIndices.push({ index, x, time });
    }
  });
  if (!labelIndices.length || labelIndices[0].x - pad.left > 52) {
    labelIndices.unshift({ index: 0, x: xAt(0), time: allTimes[0] });
  }

  ctx.fillStyle = colors.label;
  ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  labelIndices.forEach(({ x, time }) => {
    if (x < pad.left - 2 || x > width - pad.right + 2) return;
    ctx.fillText(formatJam(time), x, height - 11);
  });

  // Garis aktual dan area
  const segments = [];
  let currentSegment = [];
  actual.forEach((point, index) => {
    if (Number.isFinite(point.value)) {
      currentSegment.push({ x: xAt(index), y: yAt(point.value) });
    } else if (currentSegment.length) {
      segments.push(currentSegment);
      currentSegment = [];
    }
  });
  if (currentSegment.length) segments.push(currentSegment);

  const areaGradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  areaGradient.addColorStop(0, colors.actual);
  areaGradient.addColorStop(1, 'rgba(0,0,0,0)');

  segments.forEach((segment) => {
    if (segment.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(segment[0].x, pad.top + plotH);
    segment.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(segment[segment.length - 1].x, pad.top + plotH);
    ctx.closePath();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = areaGradient;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.strokeStyle = colors.actual;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    segment.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });

  // Garis prediksi putus-putus
  const lastActualPoint = [...actual].reverse().find((point) => Number.isFinite(point.value));
  const predictedPoints = [];
  if (lastActualPoint) {
    predictedPoints.push({ x: xNow, y: yAt(lastActualPoint.value) });
  }
  predicted.forEach((point, index) => {
    if (!Number.isFinite(point.value)) return;
    predictedPoints.push({ x: xAt(a + index), y: yAt(point.value) });
  });

  if (predictedPoints.length > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = colors.predicted;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([5, 5]);
    predictedPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Titik "sekarang"
  if (lastActualPoint) {
    ctx.beginPath();
    ctx.fillStyle = colors.surface;
    ctx.strokeStyle = colors.actual;
    ctx.lineWidth = 2.5;
    ctx.arc(xNow, yAt(lastActualPoint.value), 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Hover
  if (Number.isFinite(hoverIndex) && hoverIndex >= 0 && hoverIndex < n) {
    const hoverX = xAt(hoverIndex);
    const point = hoverIndex < a ? actual[hoverIndex] : predicted[hoverIndex - a];
    const value = point?.value;

    ctx.save();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(hoverX, pad.top);
    ctx.lineTo(hoverX, pad.top + plotH);
    ctx.stroke();
    ctx.restore();

    if (Number.isFinite(value)) {
      const hoverColor = hoverIndex < a ? colors.actual : colors.predicted;
      ctx.beginPath();
      ctx.fillStyle = colors.surface;
      ctx.strokeStyle = hoverColor;
      ctx.lineWidth = 2.5;
      ctx.arc(hoverX, yAt(value), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  state.chartHover = Number.isFinite(hoverIndex) ? hoverIndex : null;
}

/* =========================================================
   TOOLTIP & INTERAKSI GRAFIK
   ========================================================= */
function getChartIndexAtX(x) {
  const layout = state.chartLayout;
  if (!layout) return null;
  if (x < layout.left - 8 || x > layout.right + 8) return null;
  const ratio = clamp((x - layout.left) / layout.plotW, 0, 1);
  return Math.round(ratio * (layout.n - 1));
}

function showChartTooltip(index) {
  const tooltip = $('#chartTooltip');
  const layout = state.chartLayout;
  if (!tooltip || !layout || !state.chart) return;

  const actual = state.chart.actual;
  const predicted = state.chart.predicted;
  const isActual = index < layout.a;
  const point = isActual ? actual[index] : predicted[index - layout.a];
  const value = point?.value;

  if (!Number.isFinite(value)) {
    tooltip.hidden = true;
    return;
  }

  const kategori = getKategori(Math.round(hitungSubIndeks('pm2_5', value)));
  const x = layout.left + (index / (layout.n - 1)) * layout.plotW;

  tooltip.className = `chart-tooltip cat-${kategori.slug}`;
  tooltip.innerHTML = `
    <span class="tooltip-kind">${isActual ? 'Aktual' : 'Prediksi MA'}</span>
    <strong class="tooltip-value">${formatNumber(value, 1)} <small>µg/m³</small></strong>
    <span class="tooltip-time">${escapeHtml(formatTanggalPendek(point.time))} · ${formatJam(point.time)}</span>
    <span class="tooltip-cat"><i></i>${kategori.label}</span>
  `;
  tooltip.hidden = false;

  // Posisi mengikuti titik pada grafik.
  const pointY = layout.top + layout.plotH - (clamp(value, 0, layout.scaleMax) / layout.scaleMax) * layout.plotH;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const left = clamp(x, tooltipWidth / 2 + 4, layout.width - tooltipWidth / 2 - 4);
  let top = pointY - tooltipHeight - 14;
  if (top < 4) top = pointY + 16;
  top = clamp(top, 4, layout.height - tooltipHeight - 4);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideChartTooltip() {
  const tooltip = $('#chartTooltip');
  if (tooltip) tooltip.hidden = true;
}

function handleChartPointer(event) {
  if (!state.chartLayout) return;
  const canvas = $('#predictionChart');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const layout = state.chartLayout;

  if (x < layout.left - 12 || x > layout.right + 12 || y < layout.top - 14 || y > layout.bottom + 18) {
    hideChartTooltip();
    drawChart(null);
    return;
  }

  const index = getChartIndexAtX(x);
  if (index === null) return;
  drawChart(index);
  showChartTooltip(index);
}

function setupChartInteractions() {
  const canvas = $('#predictionChart');
  if (!canvas) return;
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('pointermove', handleChartPointer);
  canvas.addEventListener('pointerdown', handleChartPointer);
  canvas.addEventListener('pointerleave', () => {
    hideChartTooltip();
    drawChart(null);
  });
  canvas.addEventListener('blur', () => {
    hideChartTooltip();
    drawChart(null);
  });

  canvas.addEventListener('keydown', (event) => {
    if (!state.chartLayout) return;
    const total = state.chartLayout.n;
    let index = state.chartHover;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index === null || index === undefined) index = state.chartLayout.a - 1;
      index += event.key === 'ArrowRight' ? 1 : -1;
      index = clamp(index, 0, total - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      index = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      index = total - 1;
    } else if (event.key === 'Escape') {
      hideChartTooltip();
      drawChart(null);
      return;
    } else {
      return;
    }

    drawChart(index);
    showChartTooltip(index);
  });
}
