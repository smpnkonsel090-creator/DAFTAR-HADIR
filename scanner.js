import { db } from "./config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { Html5Qrcode } from "https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js";

// ================= Utilitas =================
function tampilPesan(teks, tipe = "info") {
  const el = document.getElementById("status");
  el.textContent = teks;
  el.className = `msg ${tipe}`;
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function parseTime(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function isDalamRentang(start, end, toleransi = 3) {
  const now = nowMinutes();
  return now >= parseTime(start) && now <= parseTime(end) + toleransi;
}

// ================= Variabel default =================
let jamDatang = "06:30";
let jamPulang = "14:00";
let tanggalLibur = [];
const toleransiMenit = 3;

// ================= Inisialisasi Absensi =================
async function inisialisasiAbsensi() {
  try {
    const snap = await getDoc(doc(db, "pengaturan", "jamSekolah"));
    if (snap.exists()) {
      const data = snap.data();
      jamDatang = data.jamDatang || jamDatang;
      jamPulang = data.jamPulang || jamPulang;
      tanggalLibur = data.tanggalLibur || [];
    }
    const today = todayKey();
    if (tanggalLibur.includes(today)) {
      tampilPesan("Hari ini libur, tidak perlu absen.", "info");
      return false;
    }
    tampilPesan("Absensi hari ini siap discan.", "info");
    return true;
  } catch (err) {
    tampilPesan("Gagal inisialisasi: " + err, "error");
    return false;
  }
}

// ================= Update Status Absensi =================
async function updateStatusAbsensi(nis) {
  const today = todayKey();
  const absRef = doc(db, "absensi", `${today}_${nis}`);
  const snap = await getDoc(absRef);

  let data = snap.exists() ? snap.data() : {
    nis,
    tanggal: today,
    status: "TA",
    jamDatang: null,
    jamPulang: null
  };

  if (["IZIN", "SAKIT"].includes(data.status)) {
    tampilPesan(`Siswa dengan status ${data.status} tidak bisa absen.`, "error");
    return;
  }

  const menit = nowMinutes();

  if (data.status === "TA") {
    if (isDalamRentang(jamDatang, jamPulang, toleransiMenit)) {
      data.status = "TK";
      data.jamDatang = menit;
      tampilPesan("Absen datang tercatat.", "success");
    } else if (menit > parseTime(jamDatang) + toleransiMenit) {
      tampilPesan("Batas absen datang sudah lewat.", "error");
    } else {
      tampilPesan("Belum waktunya absen datang.", "info");
    }
  } else if (data.status === "TK") {
    if (isDalamRentang(jamPulang, "23:59", toleransiMenit)) {
      if (data.jamDatang) {
        data.status = "Hadir";
        data.jamPulang = menit;
        tampilPesan("Absen pulang tercatat, lengkap hadir.", "success");
      } else {
        tampilPesan("Tidak absen datang, status tetap TA.", "error");
      }
    } else if (menit < parseTime(jamPulang)) {
      tampilPesan("Belum waktunya absen pulang.", "info");
    } else {
      tampilPesan("Batas absen pulang sudah lewat.", "error");
    }
  } else if (data.status === "Hadir") {
    tampilPesan("Sudah lengkap absen hari ini.", "info");
    return;
  }

  await setDoc(absRef, data);
}

// ================= Scanner Kamera =================
let html5QrCode = null;
let daftarKamera = [];
let currentCamId = null;

async function mulaiScanner(deviceId) {
  try {
    if (html5QrCode) {
      await html5QrCode.stop().catch(()=>{});
      html5QrCode.clear().catch(()=>{});
    } else {
      html5QrCode = new Html5Qrcode("reader");
    }

    await html5QrCode.start(
      { deviceId: { exact: deviceId } },
      { fps: 10, qrbox: 250 },
      decodedText => updateStatusAbsensi(decodedText.trim())
    );
    currentCamId = deviceId;
    tampilPesan("Kamera aktif", "info");
  } catch (err) {
    tampilPesan("Gagal memulai kamera: " + err, "error");
  }
}

async function initKamera() {
  try {
    daftarKamera = await Html5Qrcode.getCameras();
    if (!daftarKamera || daftarKamera.length === 0) {
      tampilPesan("Tidak ada kamera terdeteksi", "error");
      return;
    }

    // Pilih kamera belakang default
    const camBack = daftarKamera.find(c => c.label.toLowerCase().includes("back")) || daftarKamera[0];
    await mulaiScanner(camBack.id);

    // Tombol switch
    const btnFront = document.getElementById("btnFront");
    const btnBack = document.getElementById("btnBack");
    if (btnFront) btnFront.onclick = () => {
      const camFront = daftarKamera.find(c => c.label.toLowerCase().includes("front")) || daftarKamera[0];
      mulaiScanner(camFront.id);
    };
    if (btnBack) btnBack.onclick = () => {
      const cam = daftarKamera.find(c => c.label.toLowerCase().includes("back")) || daftarKamera[0];
      mulaiScanner(cam.id);
    };
  } catch (err) {
    tampilPesan("Gagal inisialisasi kamera: " + err, "error");
  }
}

// ================= Start =================
(async () => {
  const bolehScan = await inisialisasiAbsensi();
  if (!bolehScan) return;
  await initKamera();
})();
