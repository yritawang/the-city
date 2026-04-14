// printer.js
// webusb + escpos integration for the rongta rp326
// reads city data from localstorage, builds a receipt, sends raw bytes via webusb


// escpos byte helpers

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

function encodeText(str) {
  const safe = str.replace(/[^\x20-\x7e]/g, '?');
  return new TextEncoder().encode(safe);
}

function buildBuffer(commands) {
  const arrays = commands.map(c => (c instanceof Uint8Array ? c : new Uint8Array(c)));
  const total  = arrays.reduce((sum, a) => sum + a.length, 0);
  const out    = new Uint8Array(total);
  let offset   = 0;
  arrays.forEach(a => { out.set(a, offset); offset += a.length; });
  return out;
}

const cmd = {
  init:        () => [ESC, 0x40],
  cut:         () => [GS,  0x56, 0x41, 0x03],
  feedLines:   (n) => [ESC, 0x64, n],
  alignLeft:   () => [ESC, 0x61, 0x00],
  alignCenter: () => [ESC, 0x61, 0x01],
  bold:        (on) => [ESC, 0x45, on ? 0x01 : 0x00],
  doubleWidth: (on) => [ESC, 0x21, on ? 0x20 : 0x00],
  textLine:    (str) => [...encodeText(str), LF],
  emptyLine:   () => [LF],
};


// 5-pointed star ascii art — fits within 42 chars

const ASCII_ART = [
  "             *             ",
  "            ***            ",
  "           *****           ",
  "  ******** ***** ********  ",
  "   ***********************  ",
  "    *********************   ",
  "      *****************     ",
  "    ***             ***     ",
  "   ***               ***    ",
  "  **                   **   ",
];

const ASCII_ART_SAFE = ASCII_ART;


// data helpers

const DISTRICTS = ['garden', 'cornerstore', 'shrine', 'tower', 'plaza'];

const DISTRICT_META = {
  garden:      { label: 'The garden',      emotion: 'Growth'    },
  cornerstore: { label: 'The cornerstore', emotion: 'Routine'   },
  shrine:      { label: 'The shrine',      emotion: 'Reverence' },
  tower:       { label: 'The tower',       emotion: 'Solitude'  },
  plaza:       { label: 'The plaza',       emotion: 'Community' },
};

const STOPWORDS = new Set([
  'i','me','my','we','our','you','your','it','its','the','a','an',
  'and','or','but','in','on','at','to','for','of','with','this',
  'that','was','is','are','were','be','been','have','had','has',
  'do','did','would','could','there','they','them','what','when',
  'where','how','so','if','as','by','from','not','no','just',
  'about','up','out','like','than','more','can','will','one','all',
  'also','into','who','which','their','his','her','he','she',
  'place','feel','felt','think','thought','remember','know','still',
  'even','very','much','many','some','any','time','way'
]);

function extractKeywords(sessions, topN = 5) {
  const freq = {};
  sessions.filter(s => !s.isTrainThought).forEach(session => {
    Object.entries(session.answers).forEach(([qi, answer]) => {
      if (parseInt(qi) === 0 || parseInt(qi) === 5 || !answer) return;
      answer.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOPWORDS.has(w))
        .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function collectCityData(userName) {
  const cityName = localStorage.getItem('cityName') || 'Unnamed city';
  const districts = [];

  DISTRICTS.forEach(key => {
    const sessions = JSON.parse(localStorage.getItem(`${key}-sessions`) || '[]');
    if (sessions.length === 0) return;

    const meta         = DISTRICT_META[key];
    const districtName = localStorage.getItem(`${key}-name`) || meta.label;

    const validSessions = sessions
      .filter(s => !s.isTrainThought && s.answers[0])
      .sort((a, b) => b.timestamp - a.timestamp);

    if (validSessions.length === 0) return;

    const latest      = validSessions[0];
    const realPlace   = latest.answers[0];
    const dateLogged  = latest.date || new Date(latest.timestamp).toLocaleDateString('en-US');
    const keywords    = extractKeywords(sessions);

    districts.push({ key, meta, districtName, realPlace, dateLogged, keywords });
  });

  return { cityName, userName: userName || '', districts };
}


// receipt content builder

const PAPER_WIDTH = 42;

function pad(str, n, right = false) {
  const s = String(str).slice(0, n);
  return right ? s.padStart(n) : s.padEnd(n);
}

function wrap(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach(word => {
    const candidate = current ? current + ' ' + word : word;
    if (candidate.length <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.slice(0, maxWidth);
    }
  });
  if (current) lines.push(current);
  return lines;
}

function toSentenceCase(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// buildReceiptBytes is overridden by print.html to match the preview
// this default is a fallback only
function buildReceiptBytes(data) {
  const { cityName, userName, districts } = data;
  const now = new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  });

  const parts = [];

  parts.push(cmd.init());
  parts.push(cmd.feedLines(1));

  parts.push(cmd.alignCenter());
  ASCII_ART_SAFE.forEach(line => parts.push(cmd.textLine(line)));
  parts.push(cmd.emptyLine());

  parts.push(cmd.bold(true));
  parts.push(cmd.doubleWidth(true));
  parts.push(cmd.textLine(cityName.slice(0, 20).toUpperCase()));
  parts.push(cmd.doubleWidth(false));
  parts.push(cmd.bold(false));

  if (userName) parts.push(cmd.textLine(toSentenceCase(userName)));
  parts.push(cmd.textLine('Emotional hometown'));
  parts.push(cmd.textLine(now));
  parts.push(cmd.emptyLine());
  parts.push(cmd.alignLeft());
  parts.push(cmd.textLine('-'.repeat(PAPER_WIDTH)));

  districts.forEach(d => {
    parts.push(cmd.emptyLine());
    const emotionTag = d.meta.emotion;
    const nameSlice  = d.districtName.slice(0, PAPER_WIDTH - emotionTag.length - 1);
    parts.push(cmd.bold(true));
    parts.push(cmd.textLine(pad(nameSlice, PAPER_WIDTH - emotionTag.length) + emotionTag));
    parts.push(cmd.bold(false));
    const placeLines = wrap(d.realPlace, PAPER_WIDTH - 2);
    placeLines.forEach((line, i) => parts.push(cmd.textLine((i === 0 ? '. ' : '  ') + line)));
    parts.push(cmd.textLine('  Last logged: ' + d.dateLogged));
    if (d.keywords.length > 0) {
      wrap(d.keywords.join(' / '), PAPER_WIDTH - 2).forEach((line, i) => {
        parts.push(cmd.textLine((i === 0 ? '~ ' : '  ') + line));
      });
    }
  });

  parts.push(cmd.emptyLine());
  parts.push(cmd.alignCenter());
  parts.push(cmd.textLine('-'.repeat(PAPER_WIDTH)));
  parts.push(cmd.textLine('A city built from memory'));
  parts.push(cmd.feedLines(4));
  parts.push(cmd.cut());

  return buildBuffer(parts);
}


// receipt preview renderer

function renderPreview(data) {
  const el = document.getElementById('receipt-preview');
  if (!el) return;
  // preview is handled by print.html's initReceipt — nothing to do here
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


// webusb printer connection

let usbDevice    = null;
let usbInterface = null;
let usbEndpoint  = null;

function findBulkOutEndpoint(device) {
  for (const iface of device.configuration.interfaces) {
    for (const alt of iface.alternates) {
      for (const ep of alt.endpoints) {
        if (ep.direction === 'out' && ep.type === 'bulk') {
          return { iface: iface.interfaceNumber, endpoint: ep.endpointNumber };
        }
      }
    }
  }
  return null;
}

async function connectPrinter() {
  setStatus('Requesting USB device...', '');

  try {
    usbDevice = await navigator.usb.requestDevice({ filters: [] });
    await usbDevice.open();

    if (usbDevice.configuration === null) {
      await usbDevice.selectConfiguration(1);
    }

    const found = findBulkOutEndpoint(usbDevice);
    if (!found) throw new Error('No bulk-out endpoint found on this device.');

    usbInterface = found.iface;
    usbEndpoint  = found.endpoint;

    await usbDevice.claimInterface(usbInterface);

    setStatus('Printer connected', 'ok');
    document.getElementById('print-btn').disabled = false;
    document.getElementById('connect-btn').textContent = 'Reconnect printer';
  } catch (err) {
    setStatus('Connection failed: ' + err.message, 'error');
    usbDevice = null;
  }
}

async function sendToDevice(bytes) {
  if (!usbDevice || !usbEndpoint) throw new Error('Printer not connected.');
  const CHUNK = 64;
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    const chunk = bytes.slice(offset, offset + CHUNK);
    await usbDevice.transferOut(usbEndpoint, chunk);
  }
}


// print action

async function printReceipt() {
  const btn      = document.getElementById('print-btn');
  const userName = document.getElementById('user-name-input')?.value?.trim() || '';
  btn.disabled   = true;
  setStatus('Printing...', '');

  try {
    const data  = collectCityData(userName);
    const bytes = buildReceiptBytes(data);
    await sendToDevice(bytes);
    setStatus('Printed successfully', 'ok');
  } catch (err) {
    setStatus('Print failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}


// ui helpers

function setStatus(msg, type) {
  const el = document.getElementById('print-status');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'print-status' + (type ? ' ' + type : '');
}

function initNameInput() {
  const input = document.getElementById('user-name-input');
  if (!input) return;
  // preview is rendered by initReceipt in print.html, nothing extra needed
}


// init

document.addEventListener('DOMContentLoaded', () => {
  if (!navigator.usb) {
    setStatus('WebUSB not supported in this browser (use Chrome or Edge)', 'error');
    document.getElementById('connect-btn').disabled = true;
    return;
  }

  const cityName = localStorage.getItem('cityName') || 'Your city';
  const titleEl  = document.getElementById('page-city-title');
  if (titleEl) titleEl.textContent = cityName;

  initNameInput();

  document.getElementById('connect-btn').addEventListener('click', connectPrinter);
  document.getElementById('print-btn').addEventListener('click', printReceipt);
});