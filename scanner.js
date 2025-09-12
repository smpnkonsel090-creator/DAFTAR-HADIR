import { Html5Qrcode } from "https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js";
import { db } from "./config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

function tampilPesan(teks, tipe = "info") {
  const el = document.getElementById("status");
  el.textContent = teks;
  el.className = `msg ${tipe}`;
}

// Update absensi ke Firestore
async function updateStatusAbsensi(nis) {
  const today = new Date().toISOString().split("T")[0];
  const absRef = doc(db, "absensi", `${today}_${nis}`);
  const snap = await getDoc(absRef);

  let data = snap.exists() ? snap.data() : {
    nis,
    tanggal: today,
    status: "TA",
    jamDatang: null,
    jamPulang: null
  };

  const menit = new Date().getHours() * 60 + new Date().getMinutes();

  if (data.status === "TA") {
    data.status = "TK";
    data.jamDatang = menit;
    tampilPesan("Absen datang tercatat.", "success");
  } else if (data.status === "TK") {
    if (data.jamDatang) {
      data.status = "Hadir";
      data.jamPulang = menit;
      tampilPesan("Absen pulang tercatat, lengkap hadir.", "success");
    }
  } else if (data.status === "Hadir") {
    tampilPesan("Sudah lengkap absen hari ini.", "info");
    return;
  }

  await setDoc(absRef, data);
}

// Event klik tombol Start
document.getElementById("startBtn").addEventListener("click", async () => {
  const html5QrCode = new Html5Qrcode("reader");
  await html5QrCode.start(
    { facingMode: "environment" }, // kamera belakang
    { fps: 10, qrbox: 250 },
    (decodedText) => updateStatusAbsensi(decodedText.trim())
  ).catch(err => tampilPesan("Kamera gagal aktif: " + err, "error"));
  tampilPesan("Kamera aktif, silakan scan QR.", "info");
});
