// ─── i18n dictionary ───────────────────────────────────────────────────────
// Every user-visible string lives here. Functions are used for strings that
// need runtime values; static strings are plain strings. `data-i18n` attrs in
// HTML look up keys by name; JS callers use `t(key, ...args)`.
const i18n = {
  ko: {
    rotate: "회전",
    flipH: "좌우",
    flipV: "상하",
    fullscreen: "전체화면",
    reset: "초기화",
    photoSave: "📷 사진 저장",
    recStart: "🔴 녹화 시작",
    recStop: "⏹ 녹화 중지",
    viewAdjust: "화면 조정",
    zoom: "줌",
    brightness: "밝기",
    contrast: "대비",
    saturation: "채도",
    statusPanel: "상태",
    streamLabel: "스트림",
    frames: "프레임",
    uptime: "가동",
    battery: "배터리",
    voltage: "전압",
    chargeRow: "상태",
    mac: "MAC",
    gyro: "자이로",
    chargeCharging: "⚡ 충전 중",
    chargeFull: "✓ 완충 (대기)",
    chargeFullCharging: "✓ 완충 (충전 중)",
    chargeDischarging: "🔋 배터리 사용",
    chargeUnknown: "—",
    deviceInfo: "기기 정보",
    model: "모델",
    manufacturer: "제조사",
    soc: "SoC",
    firmware: "펌웨어",
    build: "빌드",
    streamType: "스트림",
    ble: "BLE",
    bleYes: "지원",
    bleNo: "없음",
    ledPanel: "LED",
    currentPwm: "현재 PWM",
    ledOn: "💡 LED 켜기",
    ledOff: "💡 LED 끄기",
    ledNeutral: "💡 LED",
    experimental: "실험적",
    expWarning: "⚠ 기기에 따라 0과 그 외 값(=ON)으로만 반응하고, 중간 밝기 조절이 안 될 수 있습니다.",
    pwmTry: "PWM 시도",
    levelRawLabel: "Level (raw)",
    levelTry: "Level 시도",
    resolutionPanel: "해상도 변경",
    resWarning: "⚠ 기기에 따라 미지원일 수 있습니다. 명령은 전송되지만 실제 영상 해상도가 바뀌지 않을 수 있습니다.",
    wifiPanel: "Wi-Fi 설정 ⚠️",
    wifiWarning: "⚠ 변경 사항은 카메라에 저장되지만 <b>다음 재부팅 시점에 적용</b>됩니다. 카메라 전원을 끄고 다시 켜면 새 SSID/비밀번호로 접속할 수 있습니다.",
    newSsid: "새 SSID",
    ssidPlaceholder: "예: MyOtoscope",
    applySsid: "SSID 적용",
    newPassword: "새 비밀번호 (8~63자)",
    pwdPlaceholder: "WPA2 password",
    applyPassword: "비밀번호 적용",
    clearPassword: "비밀번호 해제 (오픈 AP)",
    powerPanel: "전원",
    shutdown: "종료",
    confirmShutdown: "종료 하시겠습니까?\\n물리 버튼으로만 다시 켤 수 있습니다.",
    confirmSetSsid: (name) => `SSID를 "${name}"으로 저장하시겠습니까?\\n다음 재부팅 시 적용됩니다.`,
    confirmSetPassword: "비밀번호를 저장하시겠습니까?\\n다음 재부팅 시 적용됩니다.",
    confirmClearPassword: "비밀번호를 제거(오픈 AP로 전환)하시겠습니까?\\n다음 재부팅 시 적용됩니다.",
    tResetAll: "초기화",
    tResetAdjust: "화면 조정 초기화",
    tNoFrame: "아직 영상이 안 들어옴",
    tPhotoFail: "사진 저장 실패",
    tPhotoSaved: "📷 사진 저장됨",
    tNoRecSupport: "이 브라우저는 녹화 미지원",
    tNoCaptureStream: "captureStream 미지원",
    tRecStartFail: (m) => `녹화 시작 실패: ${m}`,
    tRecStarted: "🔴 녹화 시작",
    tRecNoData: "녹화 데이터 없음",
    tRecSaved: (s, mb) => `⏹ 녹화 저장됨 (${s}초, ${mb}MB)`,
    tFsFail: "전체화면 실패",
    tSsidEmpty: "SSID를 입력하세요",
    tSsidSaved: "SSID 저장 — 재부팅 시 적용",
    tSsidFail: "SSID 저장 실패",
    tPwdLen: "비밀번호 8~63자",
    tPwdSaved: "비밀번호 저장 — 재부팅 시 적용",
    tPwdFail: "실패",
    tPwdCleared: "비밀번호 제거 — 재부팅 시 적용",
    tPwm: (v) => `PWM = ${v}`,
    tPwmFail: "PWM 설정 실패",
    tLevel: (v) => `Level = ${v}`,
    tLevelFail: "Level 설정 실패",
    tRes: (w, h) => `해상도 ${w}×${h}`,
    tResFail: "해상도 변경 실패",
    tCmdOk: (n) => `${n} OK`,
    tCmdFail: (n) => `${n} 실패`,
    chargingShortIcon: "⚡",
    fullShortIcon: "✓",
    fullChargingShortIcon: "✓⚡",
    onBatteryShortIcon: "🔋",
    headerMeta: (fr, up) => `${fr} frames · uptime ${up}s`,
    headerConnecting: "connecting…",
  },
  en: {
    rotate: "Rotate",
    flipH: "Flip H",
    flipV: "Flip V",
    fullscreen: "Fullscreen",
    reset: "Reset",
    photoSave: "📷 Photo",
    recStart: "🔴 Record",
    recStop: "⏹ Stop",
    viewAdjust: "View adjust",
    zoom: "Zoom",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    statusPanel: "Status",
    streamLabel: "Stream",
    frames: "Frames",
    uptime: "Uptime",
    battery: "Battery",
    voltage: "Voltage",
    chargeRow: "Charge",
    mac: "MAC",
    gyro: "Gyro",
    chargeCharging: "⚡ Charging",
    chargeFull: "✓ Full (idle)",
    chargeFullCharging: "✓ Full (trickle)",
    chargeDischarging: "🔋 On battery",
    chargeUnknown: "—",
    deviceInfo: "Device info",
    model: "Model",
    manufacturer: "Vendor",
    soc: "SoC",
    firmware: "Firmware",
    build: "Build",
    streamType: "Stream",
    ble: "BLE",
    bleYes: "Yes",
    bleNo: "No",
    ledPanel: "LED",
    currentPwm: "Current PWM",
    ledOn: "💡 Turn on",
    ledOff: "💡 Turn off",
    ledNeutral: "💡 LED",
    experimental: "Experimental",
    expWarning: "⚠ Some devices only respond to 0 vs non-zero (ON); intermediate brightness may not work.",
    pwmTry: "PWM (try)",
    levelRawLabel: "Level (raw)",
    levelTry: "Level (try)",
    resolutionPanel: "Resolution",
    resWarning: "⚠ May not be supported. The command is sent but the actual video resolution may not change.",
    wifiPanel: "Wi-Fi settings ⚠️",
    wifiWarning: "⚠ Changes are saved on the camera but <b>apply only on next reboot</b>. Power-cycle the camera to connect via the new SSID/password.",
    newSsid: "New SSID",
    ssidPlaceholder: "e.g. MyOtoscope",
    applySsid: "Apply SSID",
    newPassword: "New password (8–63 chars)",
    pwdPlaceholder: "WPA2 password",
    applyPassword: "Apply password",
    clearPassword: "Clear password (open AP)",
    powerPanel: "Power",
    shutdown: "Shutdown",
    confirmShutdown: "Shutdown?\\nOnly the physical button can power it back on.",
    confirmSetSsid: (name) => `Save SSID as "${name}"?\\nWill apply on next reboot.`,
    confirmSetPassword: "Save new password?\\nWill apply on next reboot.",
    confirmClearPassword: "Clear the password (switch to open AP)?\\nWill apply on next reboot.",
    tResetAll: "Reset",
    tResetAdjust: "View reset",
    tNoFrame: "No video frame yet",
    tPhotoFail: "Photo save failed",
    tPhotoSaved: "📷 Photo saved",
    tNoRecSupport: "Recording not supported in this browser",
    tNoCaptureStream: "captureStream not supported",
    tRecStartFail: (m) => `Record start failed: ${m}`,
    tRecStarted: "🔴 Recording",
    tRecNoData: "No recording data",
    tRecSaved: (s, mb) => `⏹ Saved (${s}s, ${mb}MB)`,
    tFsFail: "Fullscreen failed",
    tSsidEmpty: "Enter an SSID",
    tSsidSaved: "SSID saved — applies on reboot",
    tSsidFail: "SSID save failed",
    tPwdLen: "Password must be 8–63 chars",
    tPwdSaved: "Password saved — applies on reboot",
    tPwdFail: "Failed",
    tPwdCleared: "Password cleared — applies on reboot",
    tPwm: (v) => `PWM = ${v}`,
    tPwmFail: "PWM set failed",
    tLevel: (v) => `Level = ${v}`,
    tLevelFail: "Level set failed",
    tRes: (w, h) => `Resolution ${w}×${h}`,
    tResFail: "Resolution change failed",
    tCmdOk: (n) => `${n} OK`,
    tCmdFail: (n) => `${n} failed`,
    chargingShortIcon: "⚡",
    fullShortIcon: "✓",
    fullChargingShortIcon: "✓⚡",
    onBatteryShortIcon: "🔋",
    headerMeta: (fr, up) => `${fr} frames · uptime ${up}s`,
    headerConnecting: "connecting…",
  },
};

const LANG_KEY = "p6x-lang-v1";
let lang = (() => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && i18n[saved]) return saved;
  } catch (e) {}
  return (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en";
})();

function t(key, ...args) {
  const dict = i18n[lang] || i18n.ko;
  const v = dict[key];
  if (typeof v === "function") return v(...args);
  if (v !== undefined) return v;
  return key;
}

function applyLang() {
  // text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // innerHTML (for strings with <b>, <code>, etc.)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  // placeholder
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  // Toggle button face shows the OTHER language
  const tog = document.getElementById("langBtn");
  if (tog) tog.textContent = lang === "ko" ? "EN" : "한";
  // Re-render dynamic labels that depend on state
  if (typeof applyView === "function") applyView();
  if (typeof updateLedButton === "function") {
    updateLedButton(lastInfo?.pwm ?? null);
  }
  if (typeof setBtnLabel === "function") {
    setBtnLabel("recBtn", (typeof mediaRecorder !== "undefined" && mediaRecorder)
      ? t("recStop") : t("recStart"));
  }
  document.documentElement.lang = lang;
}

function toggleLang() {
  lang = (lang === "ko") ? "en" : "ko";
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  applyLang();
}

const $ = (id) => document.getElementById(id);
let lastInfo = null;

// ── Stream watchdog (smart detection) ──────────────────────────────────
// Browsers close idle multipart/x-mixed-replace connections after a few
// minutes — the server keeps publishing frames but our local <img> stops
// receiving (a "zombie" connection that doesn't fire onerror). Detect this
// by combining two signals:
//   * server-side frame counter from /api/dynamic — advances when the
//     server publishes new frames
//   * pixel sampling of the local <img> — advances when the browser
//     actually decodes new frames
// If the server keeps producing frames but our pixels haven't changed for
// a long time, our connection died: reload <img>.src.
const PIXEL_SAMPLE_MS = 5000;       // sample img pixels every 5s
const STALL_AFTER_MS = 15000;       // 15s of unchanging pixels = zombie
const STALL_FRAMES_AHEAD = 50;      // ...AND server has ≥50 new frames
let lastPixelSample = null;
let lastPixelChangeAt = Date.now();
// Server frame count at the moment of the most recent pixel change. We
// compare against this (NOT against the previous poll tick) so framesAhead
// counts the entire stalled window.
let serverFramesAtLastPixelChange = null;

function reloadStream() {
  const img = document.getElementById('video');
  if (!img) return;
  img.src = '/stream.mjpg?_=' + Date.now();
  lastPixelChangeAt = Date.now();
  lastPixelSample = null;
  serverFramesAtLastPixelChange = lastInfo?.stream?.frames ?? null;
}

// Sample a tiny region of the current frame and compare to the previous sample.
// Resets lastPixelChangeAt when pixels change. Runs from a setInterval.
const _sampleCanvas = (() => {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  return c;
})();
function samplePixels() {
  const img = document.getElementById('video');
  if (!img || !img.naturalWidth) return;
  const ctx = _sampleCanvas.getContext('2d');
  try {
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    let changed = false;
    if (lastPixelSample && data.length === lastPixelSample.length) {
      for (let i = 0; i < data.length; i += 16) {  // sparse compare — every 4th pixel
        if (data[i] !== lastPixelSample[i]) { changed = true; break; }
      }
    } else {
      changed = true;   // first sample
    }
    if (changed) {
      lastPixelChangeAt = Date.now();
      serverFramesAtLastPixelChange = lastInfo?.stream?.frames ?? null;
    }
    lastPixelSample = data;
  } catch (e) {
    // CORS taint or similar — bail; the onerror path remains as fallback.
  }
}

function checkStreamHealth(serverFrames) {
  if (serverFrames == null || serverFramesAtLastPixelChange == null) return;
  const stalledFor  = Date.now() - lastPixelChangeAt;
  const framesAhead = serverFrames - serverFramesAtLastPixelChange;
  if (stalledFor >= STALL_AFTER_MS && framesAhead >= STALL_FRAMES_AHEAD) {
    reloadStream();
  }
}
let pwmDebounce, levelDebounce;
let pwmPending = false;       // suppress polling overwrite for ~3 s after a button click

// view + capture state
const view = {
  rotation: 0,     // cumulative deg (CSS); UI label uses % 360
  flipH: false,
  flipV: false,
  zoom: 1.0,       // 1.0 .. 4.0
  brightness: 100, // %
  contrast: 100,
  saturate: 100,
};

let mediaRecorder = null;
let recChunks = [];
let recDrawHandle = null;
let recStartedAt = null;

function tsName() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
}

function effectiveRotation() {
  return ((view.rotation % 360) + 360) % 360;
}

function setBtnLabel(id, text) {
  const el = document.querySelector(`#${id} .btn-label`);
  if (el) el.textContent = text;
}

function applyView() {
  const img = $('video');
  // Transform order matters when combined with rotation: CSS applies the list
  // right-to-left, so rotate must be the LAST entry to be applied first, with
  // flip applied AFTERWARDS in the screen-aligned coordinate frame. Otherwise
  // a 90°/270° rotation rotates the flip axis with it, which is unintuitive.
  const tr = [`scale(${view.zoom})`];
  if (view.flipH) tr.push('scaleX(-1)');
  if (view.flipV) tr.push('scaleY(-1)');
  tr.push(`rotate(${view.rotation}deg)`);
  img.style.transform = tr.join(' ');
  img.style.filter =
    `brightness(${view.brightness}%) contrast(${view.contrast}%) saturate(${view.saturate}%)`;
  setBtnLabel('rotBtn', `↻ ${t('rotate')} ${effectiveRotation()}°`);
  $('flipHBtn').style.background = view.flipH ? '#38404f' : '';
  $('flipVBtn').style.background = view.flipV ? '#38404f' : '';
  $('zoom').value = Math.round(view.zoom * 100);
  $('zoomVal').textContent = view.zoom.toFixed(1) + '×';
  $('brightness').value = view.brightness;
  $('brightVal').textContent = view.brightness + '%';
  $('contrast').value = view.contrast;
  $('contrastVal').textContent = view.contrast + '%';
  $('saturate').value = view.saturate;
  $('saturateVal').textContent = view.saturate + '%';
}

function cycleRotation() {
  view.rotation += 90;     // never wrap → CSS animates exactly +90 each tap
  applyView(); saveView();
}

function toggleFlipH() { view.flipH = !view.flipH; applyView(); saveView(); }
function toggleFlipV() { view.flipV = !view.flipV; applyView(); saveView(); }

function resetAll() {
  view.rotation = 0; view.flipH = false; view.flipV = false;
  view.zoom = 1.0;
  view.brightness = 100; view.contrast = 100; view.saturate = 100;
  applyView(); saveView();
  toast(t('tResetAll'), 'ok');
}

function resetAdjust() {
  // Resets only the four sliders — keeps rotation/flip intact.
  view.zoom = 1.0;
  view.brightness = 100; view.contrast = 100; view.saturate = 100;
  applyView(); saveView();
  toast(t('tResetAdjust'), 'ok');
}

function makeCaptureCanvas(img) {
  // Captures exactly what the user sees: rotation, flip, zoom, and CSS filters
  // are all baked into the resulting canvas.
  const w = img.naturalWidth || 640;
  const h = img.naturalHeight || 480;
  const eff = effectiveRotation();
  const rotated = (eff === 90 || eff === 270);
  const cw = rotated ? h : w;
  const ch = rotated ? w : h;
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.filter =
    `brightness(${view.brightness}%) contrast(${view.contrast}%) saturate(${view.saturate}%)`;
  // Canvas: last call before drawImage is applied first to image pixels.
  // Order matches the CSS chain — rotate is innermost (applied first), then
  // flip in screen frame, then zoom, then translate to center.
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(view.zoom, view.zoom);
  ctx.scale(view.flipH ? -1 : 1, view.flipV ? -1 : 1);
  ctx.rotate((eff * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas;
}

function toggleFullscreen() {
  const wrap = document.querySelector('.video-wrap');
  if (!document.fullscreenElement) {
    wrap.requestFullscreen?.().catch(() => toast(t('tFsFail'), 'err'));
  } else {
    document.exitFullscreen?.();
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function savePhoto() {
  const img = $('video');
  if (!img.naturalWidth) { toast(t('tNoFrame'), 'err'); return; }
  try {
    const canvas = makeCaptureCanvas(img);
    canvas.toBlob((blob) => {
      if (!blob) { toast(t('tPhotoFail'), 'err'); return; }
      downloadBlob(blob, `otoscope_${tsName()}.jpg`);
      toast(t('tPhotoSaved'), 'ok');
    }, 'image/jpeg', 0.92);
  } catch (e) {
    toast(t('tPhotoFail') + ': ' + e.message, 'err');
  }
}

function pickMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

async function toggleRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    return;
  }
  const img = $('video');
  if (!img.naturalWidth) { toast(t('tNoFrame'), 'err'); return; }
  const mime = pickMimeType();
  if (!mime) { toast(t('tNoRecSupport'), 'err'); return; }
  const w = img.naturalWidth, h = img.naturalHeight;
  const eff = effectiveRotation();
  const rotated = (eff === 90 || eff === 270);
  const canvas = document.createElement('canvas');
  canvas.width  = rotated ? h : w;
  canvas.height = rotated ? w : h;
  const ctx = canvas.getContext('2d');

  // Snapshot transform state at start; changes during recording don't affect output.
  const recView = { ...view };
  const draw = () => {
    if (!mediaRecorder) return;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter =
      `brightness(${recView.brightness}%) contrast(${recView.contrast}%) saturate(${recView.saturate}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(recView.zoom, recView.zoom);
    ctx.scale(recView.flipH ? -1 : 1, recView.flipV ? -1 : 1);
    ctx.rotate((eff * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2);
    ctx.restore();
    recDrawHandle = requestAnimationFrame(draw);
  };

  let stream;
  try {
    stream = canvas.captureStream(30);
  } catch (e) {
    toast(t('tNoCaptureStream'), 'err');
    return;
  }

  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  } catch (e) {
    toast(t('tRecStartFail', e.message), 'err');
    return;
  }
  recChunks = [];
  recStartedAt = Date.now();
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    if (recDrawHandle) cancelAnimationFrame(recDrawHandle);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob(recChunks, { type: mime.split(';')[0] });
    if (blob.size > 0) {
      downloadBlob(blob, `otoscope_${tsName()}.${ext}`);
      const secs = ((Date.now() - recStartedAt) / 1000).toFixed(1);
      toast(t('tRecSaved', secs, (blob.size/1024/1024).toFixed(1)), 'ok');
    } else {
      toast(t('tRecNoData'), 'err');
    }
    mediaRecorder = null;
    recChunks = [];
    setBtnLabel('recBtn', t('recStart'));
    $('recBtn').classList.remove('recording');
    $('recDot').style.display = 'none';
  };
  mediaRecorder.start(1000);
  draw();
  setBtnLabel('recBtn', t('recStop'));
  $('recBtn').classList.add('recording');
  $('recDot').style.display = 'block';
  toast(t('tRecStarted'), 'ok');
}

function fmt(v) {
  return v === null || v === undefined ? '—' : v;
}
function toast(msg, kind = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + kind;
  setTimeout(() => t.className = 'toast', 1800);
}
async function api(path, opts = {}) {
  try {
    const r = await fetch(path, opts);
    if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
    return await r.json();
  } catch (e) {
    toast(e.message, 'err');
    return null;
  }
}
// First fetch = full snapshot (slow, ~1s+, includes static board info).
// Subsequent polls = lightweight /api/dynamic (skips board + mac).
let initialFetched = false;
async function refreshInfo() {
  const url = initialFetched ? '/api/dynamic' : '/api/info';
  const info = await api(url);
  if (!info) { $('liveDot').classList.remove('live'); return; }
  $('liveDot').classList.add('live');
  initialFetched = true;

  // stream
  const s = info.stream || {};
  $('frames').textContent = fmt(s.frames);
  $('uptime').textContent = s.uptime != null ? s.uptime + 's' : '—';
  if (lastInfo && s.frames != null && lastInfo.stream && lastInfo.stream.frames != null) {
    const dF = s.frames - lastInfo.stream.frames;
    const dT = (s.uptime - lastInfo.stream.uptime) || 1;
    $('streamFps').textContent = (dF / dT).toFixed(1) + ' fps';
  }
  lastInfo = info;
  $('headerMeta').textContent = t('headerMeta', s.frames || 0, s.uptime || 0);
  checkStreamHealth(s.frames);


  // battery (decimal)
  const bat = info.battery || {};
  $('battery').textContent = bat.percent != null ? bat.percent + ' %' : '—';
  $('batterySummary').textContent = bat.percent != null ? bat.percent + ' %' : '—';
  $('voltage').textContent = bat.voltage_mv != null
    ? (bat.voltage_mv / 1000).toFixed(3) + ' V'
    : '—';
  // byte[6] bitfield: bit0 = charging current, bit1 = full
  let stateKey = 'chargeUnknown';
  let stateIcon = '';
  if (bat.is_charging != null) {
    if (bat.is_charging && bat.is_full)        { stateKey = 'chargeFullCharging'; stateIcon = t('fullChargingShortIcon'); }
    else if (bat.is_charging)                  { stateKey = 'chargeCharging';     stateIcon = t('chargingShortIcon'); }
    else if (bat.is_full)                      { stateKey = 'chargeFull';         stateIcon = t('fullShortIcon'); }
    else                                       { stateKey = 'chargeDischarging';  stateIcon = t('onBatteryShortIcon'); }
  }
  $('chargeState').textContent = t(stateKey);
  $('chargeSummary').textContent = stateIcon;

  // mac & board info — only present in the initial /api/info response.
  if (info.board) {
    const board = info.board;
    const mac = info.mac || board.mac;
    if (mac && mac.length >= 12) {
      $('mac').textContent = mac.length === 12
        ? mac.match(/.{2}/g).join(':')
        : mac;
    } else {
      $('mac').textContent = '—';
    }
    const modelText = board.brand && board.model ? `${board.brand} ${board.model}` : board.model;
    $('bModel').textContent  = fmt(modelText);
    $('bModelSummary').textContent = modelText || '—';
    $('bMfr').textContent    = fmt(board.manufacturer);
    $('bSoc').textContent    = fmt(board.soc);
    $('bFw').textContent     = fmt(board.firmware);
    $('bFwDate').textContent = fmt(board.fw_date);
    $('bStream').textContent = fmt(board.stream_type);
    $('bBle').textContent    = board.has_ble === true ? t('bleYes') : board.has_ble === false ? t('bleNo') : '—';
  }

  // accelerometer (X/Y/Z 10-12 bit packed values)
  const a = info.accel;
  $('accel').textContent = a
    ? `X=${String(a.x).padStart(4,' ')}  Y=${String(a.y).padStart(4,' ')}  Z=${String(a.z).padStart(4,' ')}`
    : '—';

  // LED current display (read-only — never touch the user's slider).
  // Don't clobber an optimistic update from a recent button click.
  if (info.pwm != null && !pwmPending) {
    $('pwmCur').textContent = info.pwm;
    updateLedButton(info.pwm);
  }
  $('levelRaw').textContent = info.level != null
    ? '0x' + (info.level >>> 0).toString(16).padStart(8, '0') + ' (' + info.level + ')'
    : '—';
}

async function setPwm(v) {
  $('pwm').value = v;
  $('pwmVal').textContent = v;
  $('pwmCur').textContent = v;     // optimistic update — show immediately
  updateLedButton(v);
  pwmPending = true;
  setTimeout(() => { pwmPending = false; }, 3000);
  const r = await api('/api/led?pwm=' + v, { method: 'POST' });
  if (r && r.ok) toast(t('tPwm', v), 'ok');
  else toast(t('tPwmFail'), 'err');
}

function updateLedButton(pwm) {
  const btn = $('ledToggleBtn');
  if (!btn) return;
  if (pwm == null) {
    setBtnLabel('ledToggleBtn', t('ledNeutral')); btn.classList.remove('led-on'); return;
  }
  const on = pwm > 0;
  setBtnLabel('ledToggleBtn', on ? t('ledOff') : t('ledOn'));
  btn.classList.toggle('led-on', on);
}

function toggleLed() {
  // Derive current state from the readback. Treat anything >0 as ON.
  const cur = parseInt($('pwmCur').textContent);
  const next = cur > 0 ? 0 : 1;
  setPwm(next);
}
async function setLevel(v) {
  $('level').value = v;
  $('levelVal').textContent = v;
  const r = await api('/api/led?level=' + v, { method: 'POST' });
  if (r && r.ok) toast(t('tLevel', v), 'ok');
  else toast(t('tLevelFail'), 'err');
}
async function setRes(w, h) {
  const r = await api(`/api/resolution?w=${w}&h=${h}`, { method: 'POST' });
  if (r && r.ok) toast(t('tRes', w, h), 'ok');
  else toast(t('tResFail'), 'err');
}
async function cmd(name, confirmMsg) {
  if (!confirm(confirmMsg)) return;
  const r = await api('/api/' + name, { method: 'POST' });
  if (r && r.ok) toast(t('tCmdOk', name), 'ok');
  else toast(t('tCmdFail', name), 'err');
}

// Wi-Fi config — all destructive: warn explicitly before each call.
async function wifiSetName() {
  const name = $('newSsid').value.trim();
  if (!name) { toast(t('tSsidEmpty'), 'err'); return; }
  if (!confirm(t('confirmSetSsid', name))) return;
  const r = await api('/api/wifi/set-name?name=' + encodeURIComponent(name), { method: 'POST' });
  toast(r?.ok ? t('tSsidSaved') : t('tSsidFail'), r?.ok ? 'ok' : 'err');
}
async function wifiSetPassword() {
  const pw = $('newPass').value;
  if (pw.length < 8 || pw.length > 63) { toast(t('tPwdLen'), 'err'); return; }
  if (!confirm(t('confirmSetPassword'))) return;
  const r = await api('/api/wifi/set-password?password=' + encodeURIComponent(pw), { method: 'POST' });
  toast(r?.ok ? t('tPwdSaved') : t('tPwdFail'), r?.ok ? 'ok' : 'err');
  $('newPass').value = '';
}
async function wifiClearPassword() {
  if (!confirm(t('confirmClearPassword'))) return;
  const r = await api('/api/wifi/clear-password', { method: 'POST' });
  toast(r?.ok ? t('tPwdCleared') : t('tPwdFail'), r?.ok ? 'ok' : 'err');
}

// Image-adjustment sliders → update view state on input
['zoom','brightness','contrast','saturate'].forEach((k) => {
  const el = $(k);
  if (!el) return;
  el.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    view[k] = (k === 'zoom') ? v / 100 : v;
    applyView();
    saveView();
  });
});

// Persist view + UI state in localStorage so settings survive page reloads.
const VIEW_KEY = 'p6x-view-v1';
function saveView() {
  try { localStorage.setItem(VIEW_KEY, JSON.stringify(view)); } catch (e) {}
}
function loadView() {
  try {
    const s = localStorage.getItem(VIEW_KEY);
    if (!s) return;
    Object.assign(view, JSON.parse(s));
  } catch (e) {}
}

// Keyboard shortcuts (ignored while a text/range input has focus).
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  let handled = true;
  switch (e.key) {
    case ' ':           savePhoto(); break;
    case 'r': case 'R': toggleRecording(); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'h': case 'H': toggleFlipH(); saveView(); break;
    case 'v': case 'V': toggleFlipV(); saveView(); break;
    case 'l': case 'L': toggleLed(); break;
    case 'ArrowLeft':   view.rotation -= 90; applyView(); saveView(); break;
    case 'ArrowRight':  view.rotation += 90; applyView(); saveView(); break;
    case '+': case '=': view.zoom = Math.min(4.0, view.zoom + 0.1); applyView(); saveView(); break;
    case '-': case '_': view.zoom = Math.max(1.0, view.zoom - 0.1); applyView(); saveView(); break;
    case '0':           resetAll(); saveView(); break;
    default:            handled = false;
  }
  if (handled) e.preventDefault();
});

$('pwm').addEventListener('input', e => {
  $('pwmVal').textContent = e.target.value;
});
$('pwm').addEventListener('change', e => {
  clearTimeout(pwmDebounce);
  pwmDebounce = setTimeout(() => setPwm(parseInt(e.target.value)), 100);
});
$('level').addEventListener('input', e => {
  $('levelVal').textContent = e.target.value;
});
$('level').addEventListener('change', e => {
  clearTimeout(levelDebounce);
  levelDebounce = setTimeout(() => setLevel(parseInt(e.target.value)), 100);
});

applyLang();
$('headerMeta').textContent = t('headerConnecting');
loadView();
applyView();

refreshInfo();
setInterval(refreshInfo, 1000);

// Sample <img> pixels periodically; checkStreamHealth (called from refreshInfo)
// uses lastPixelChangeAt + server frame counter to decide when to reload.
setInterval(samplePixels, PIXEL_SAMPLE_MS);

// Auto-retry on hard <img> errors (server close, network reset).
{
  const img = $('video');
  if (img) {
    img.addEventListener('error', () => {
      setTimeout(reloadStream, 1500);
    });
  }
}

// 30 Hz accelerometer stream via SSE — EventSource auto-reconnects on drop.
function openAccelStream() {
  const es = new EventSource('/api/accel/stream');
  es.onmessage = (e) => {
    try {
      const a = JSON.parse(e.data);
      $('accel').textContent =
        `X=${String(a.x).padStart(4,' ')}  Y=${String(a.y).padStart(4,' ')}  Z=${String(a.z).padStart(4,' ')}`;
    } catch (_) {}
  };
}
openAccelStream();
