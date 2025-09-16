import { Html5Qrcode } from "https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js";
import { db } from "./config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");

let html5QrCode = null;

function tampilPesan(teks, tipe = "info") {
  statusEl.textContent = teks;
  statusEl.className = `msg ${tipe}`;
}

// Update absensi ke Firestore
async function updateStatusAbsensi(nis) {
  try {
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
      tampilPesan(`NIS ${nis} absen datang tercatat.`, "success");
    } else if (data.status === "TK") {
      if (data.jamDatang) {
        data.status = "Hadir";
        data.jamPulang = menit;
        tampilPesan(`NIS ${nis} absen pulang tercatat, lengkap hadir.`, "success");
      }
    } else if (data.status === "Hadir") {
      tampilPesan(`NIS ${nis} sudah lengkap absen hari ini.`, "info");
      return;
    }

    await setDoc(absRef, data);
  } catch (err) {
    console.error("Error update absensi:", err);
    tampilPesan("Gagal update absensi: " + err, "error");
  }
}

// Toggle Start/Stop
startBtn.addEventListener("click", async () => {
  if (html5QrCode) {
    // stop scanner
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
      html5QrCode = null;
      tampilPesan("Scanner dihentikan.", "info");
      startBtn.textContent = "Mulai Scanner";
    } catch (err) {
      console.error("Error stop scanner:", err);
      tampilPesan("Gagal menghentikan scanner: " + err, "error");
    }
  } else {
    // start scanner
    try {
      html5QrCode = new Html5Qrcode("reader");
      await html5QrCode.start(
        { facingMode: "environment" }, // kamera belakang
        { fps: 10, qrbox: 250 },
        (decodedText) => updateStatusAbsensi(decodedText.trim())
      );
      tampilPesan("Kamera aktif, arahkan ke QR.", "info");
      startBtn.textContent = "Stop Scanner";
    } catch (err) {
      console.error("Error start scanner:", err);
      tampilPesan("Kamera gagal aktif: " + err, "error");
      html5QrCode = null;
    }
  }
});
