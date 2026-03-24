const NOTES_EMAILJS_PUBLIC_KEY  = 'ZZNtVXGZ3hq-CKIBx';
const NOTES_EMAILJS_SERVICE_ID  = 'service_y1tro6s';
const NOTES_EMAILJS_TEMPLATE_ID = 'template_783fqt8';
const NOTES_RECIPIENT           = 'yritawang22@gmail.com';


// storage helpers

function getNotes() {
  return JSON.parse(localStorage.getItem('rita-notes') || '[]');
}

function saveNotes(notes) {
  localStorage.setItem('rita-notes', JSON.stringify(notes));
}

function getParticipantInfo() {
  return JSON.parse(localStorage.getItem('rita-participant') || '{}');
}

function saveParticipantInfo(info) {
  localStorage.setItem('rita-participant', JSON.stringify(info));
}


// check if we need to send yesterday's notes (new day detected)

function checkDailyDigest() {
  const lastSent = localStorage.getItem('rita-last-sent-date');
  const today    = new Date().toLocaleDateString('en-US');
  if (lastSent && lastSent !== today) {
    // new day — send yesterday's notes automatically
    sendDailyDigest(lastSent, false);
  }
  localStorage.setItem('rita-last-sent-date', today);
}


// schedule a send at 11:59pm tonight, and again every 24h after that

function scheduleMidnightSend() {
  const now          = new Date();
  const tonight      = new Date(now);
  tonight.setHours(23, 59, 0, 0);

  // if 11:59pm has already passed today, schedule for tomorrow
  if (now >= tonight) tonight.setDate(tonight.getDate() + 1);

  const msUntilSend = tonight - now;

  setTimeout(() => {
    const today = new Date().toLocaleDateString('en-US');
    sendDailyDigest(today, false);
    localStorage.setItem('rita-last-sent-date', today);
    // reschedule for the next night
    scheduleMidnightSend();
  }, msUntilSend);
}


// send digest email via emailjs

function sendDailyDigest(dateLabel, showConfirmation = true) {
  const notes       = getNotes();
  const participant = getParticipantInfo();

  // filter to notes from the given date
  const dayNotes = dateLabel
    ? notes.filter(n => n.date === dateLabel)
    : notes.filter(n => n.date === new Date().toLocaleDateString('en-US'));

  if (dayNotes.length === 0) return;

  const notesHtml = dayNotes.map(n => `
    <div style="margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #eee;">
      <div style="font-size:0.8rem;color:#888;margin-bottom:0.5rem;">${n.timestamp} — ${n.page}</div>
      <div style="margin-bottom:0.5rem;"><strong>What they were doing:</strong> ${n.activity}</div>
      <div><strong>Comments:</strong> ${n.comments}</div>
    </div>
  `).join('');

  // load emailjs sdk if not already loaded, then init and send
  const sendIt = () => {
    emailjs.init({ publicKey: NOTES_EMAILJS_PUBLIC_KEY });
    emailjs.send(NOTES_EMAILJS_SERVICE_ID, NOTES_EMAILJS_TEMPLATE_ID, {
      participant_name: participant.name || 'Unknown',
      group_number:     participant.group || 'Unknown',
      date:             dateLabel || new Date().toLocaleDateString('en-US'),
      notes_html:       notesHtml,
      to_email:         NOTES_RECIPIENT,
    })
    .then(() => {
      // mark all sent notes as sent in storage
      const allNotes = getNotes();
      const sentDate = dateLabel || new Date().toLocaleDateString('en-US');
      allNotes.forEach(n => { if (n.date === sentDate) n.sent = true; });
      saveNotes(allNotes);
      renderNotesList();
      if (showConfirmation) showNotesSentMessage();
    })
    .catch(err => {
      const msg = err?.text || err?.message || JSON.stringify(err);
      console.error('notes emailjs error:', msg);
      if (showConfirmation) alert('Could not send notes: ' + msg);
    });
  };

  if (typeof emailjs !== 'undefined') {
    sendIt();
  } else {
    const script  = document.createElement('script');
    script.src    = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.onload = sendIt;
    document.head.appendChild(script);
  }
}

function showNotesSentMessage() {
  const msg = document.getElementById('notes-sent-msg');
  if (!msg) return;
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}


// get current page name for context

function getCurrentPageName() {
  const path = window.location.pathname;
  if (path.includes('map'))           return 'City Map';
  if (path.includes('shrine'))        return 'Shrine';
  if (path.includes('garden'))        return 'Garden';
  if (path.includes('cornerstore'))   return 'Cornerstore';
  if (path.includes('tower'))         return 'Tower';
  if (path.includes('plaza'))         return 'Plaza';
  if (path.includes('index') || path === '/') return 'Home';
  return 'Unknown Page';
}


// render saved notes in the panel

function renderNotesList() {
  const list = document.getElementById('notes-list');
  if (!list) return;
  const notes = getNotes();
  const today = new Date().toLocaleDateString('en-US');
  const todays = [...notes].filter(n => n.date === today).reverse();

  if (todays.length === 0) {
    list.innerHTML = '<p style="opacity:0.4;font-size:0.78rem;padding:0.5rem 0;">No notes yet today.</p>';
    return;
  }

  list.innerHTML = todays.map((n, i) => {
    const realIdx = notes.length - 1 - i;
    const isSent  = !!n.sent;
    return `
      <div class="rita-note-item ${isSent ? 'rita-note-sent' : ''}">
        <div class="rita-note-meta-row">
          <span class="rita-note-meta">${n.timestamp} · ${n.page}</span>
          <div class="rita-note-actions">
            ${isSent ? '<span class="rita-note-sent-badge">(sent)</span>' : ''}
            ${!isSent ? `<button class="rita-note-send-now mono" data-idx="${realIdx}">send now</button>` : ''}
            <button class="rita-note-delete mono" data-idx="${realIdx}">delete</button>
          </div>
        </div>
        <div class="rita-note-activity"><strong>Doing:</strong> ${n.activity}</div>
        <div class="rita-note-comments"><strong>Comments:</strong> ${n.comments}</div>
      </div>
    `;
  }).join('');

  // attach delete listeners
  list.querySelectorAll('.rita-note-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx   = parseInt(btn.dataset.idx);
      const notes = getNotes();
      notes.splice(idx, 1);
      saveNotes(notes);
      renderNotesList();
    });
  });

  // attach per-note send now listeners
  list.querySelectorAll('.rita-note-send-now').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx       = parseInt(btn.dataset.idx);
      const allNotes  = getNotes();
      const note      = allNotes[idx];
      if (!note) return;
      const participant = getParticipantInfo();

      const noteHtml = `
        <div style="margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #eee;">
          <div style="font-size:0.8rem;color:#888;margin-bottom:0.5rem;">${note.timestamp} — ${note.page}</div>
          <div style="margin-bottom:0.5rem;"><strong>What they were doing:</strong> ${note.activity}</div>
          <div><strong>Comments:</strong> ${note.comments}</div>
        </div>
      `;

      const sendIt = () => {
        emailjs.init({ publicKey: NOTES_EMAILJS_PUBLIC_KEY });
        emailjs.send(NOTES_EMAILJS_SERVICE_ID, NOTES_EMAILJS_TEMPLATE_ID, {
          participant_name: participant.name || note.name,
          group_number:     participant.group || note.group,
          date:             note.date + ' (sent immediately)',
          notes_html:       noteHtml,
          to_email:         NOTES_RECIPIENT,
        })
        .then(() => {
          allNotes[idx].sent = true;
          saveNotes(allNotes);
          renderNotesList();
          showNotesSentMessage();
        })
        .catch(err => {
          const msg = err?.text || err?.message || JSON.stringify(err);
          console.error('notes send-now error:', msg);
          alert('Could not send note: ' + msg);
        });
      };

      if (typeof emailjs !== 'undefined') {
        sendIt();
      } else {
        const script  = document.createElement('script');
        script.src    = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        script.onload = sendIt;
        document.head.appendChild(script);
      }
    });
  });
}


// open/close panel

function openNotesPanel() {
  const panel = document.getElementById('rita-notes-panel');
  if (!panel) return;
  panel.classList.add('active');
  renderNotesList();

  // pre-fill participant info if saved
  const info = getParticipantInfo();
  const nameEl  = document.getElementById('rita-input-name');
  const groupEl = document.getElementById('rita-input-group');
  if (nameEl  && info.name)  nameEl.value  = info.name;
  if (groupEl && info.group) groupEl.value = info.group;
}

function closeNotesPanel() {
  document.getElementById('rita-notes-panel')?.classList.remove('active');
}


// inject ui into every page

document.addEventListener('DOMContentLoaded', () => {

  checkDailyDigest();
  scheduleMidnightSend();

  const ui = document.createElement('div');
  ui.innerHTML = `
    <!-- notes toggle button: fixed bottom right -->
    <button class="rita-notes-btn" id="rita-notes-btn">Notes for Rita</button>

    <!-- notes panel overlay -->
    <div class="rita-notes-overlay" id="rita-notes-panel">
      <div class="rita-notes-content">

        <div class="rita-notes-header">
          <span class="rita-notes-title">Notes for Rita</span>
          <button class="rita-notes-close" id="rita-notes-close">✕</button>
        </div>

        <div class="rita-notes-body">

          <!-- left: entry form -->
          <div class="rita-notes-form-col">
            <div class="rita-notes-sent-msg" id="notes-sent-msg" style="display:none;">
              Sent to Rita!
            </div>

            <div class="rita-field">
              <label class="rita-label">Name</label>
              <input class="rita-input mono" id="rita-input-name" type="text" placeholder="Your name">
            </div>

            <div class="rita-field">
              <label class="rita-label">User test group number</label>
              <input class="rita-input mono" id="rita-input-group" type="text" placeholder="e.g. 1">
            </div>

            <div class="rita-field">
              <label class="rita-label">What are you currently doing on the website?</label>
              <textarea class="rita-input rita-textarea mono" id="rita-input-activity" placeholder="Describe what you're doing right now..." rows="3"></textarea>
            </div>

            <div class="rita-field">
              <label class="rita-label">What are your comments?</label>
              <textarea class="rita-input rita-textarea mono" id="rita-input-comments" placeholder="Any thoughts, reactions, confusion..." rows="4"></textarea>
            </div>

            <div class="rita-form-actions">
              <button class="rita-save-btn mono" id="rita-save-btn">Save note</button>
            </div>
          </div>

          <!-- right: saved notes for today -->
          <div class="rita-notes-list-col">
            <div class="rita-notes-list-header">
              Today's notes
              <span class="rita-notes-list-subtitle">Your notes are sent to Rita automatically at midnight.</span>
            <span class="rita-notes-list-subtitle">If you need to tell Rita something urgently, click the "send now" button. </span>

            </div>
            <div class="rita-notes-list" id="notes-list"></div>
            <div class="rita-notes-list-footer">
              <button class="rita-send-btn mono" id="rita-send-btn">Send today's notes to Rita</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
  document.body.appendChild(ui);

  // toggle button
  document.getElementById('rita-notes-btn').addEventListener('click', openNotesPanel);
  document.getElementById('rita-notes-close').addEventListener('click', closeNotesPanel);

  // close on overlay background click
  document.getElementById('rita-notes-panel').addEventListener('click', (e) => {
    if (e.target.id === 'rita-notes-panel') closeNotesPanel();
  });

  // helper: validate, build, and save a note from the form — returns the note or null

  function buildAndSaveNote() {
    const nameEl     = document.getElementById('rita-input-name');
    const groupEl    = document.getElementById('rita-input-group');
    const activityEl = document.getElementById('rita-input-activity');
    const commentsEl = document.getElementById('rita-input-comments');

    const name     = nameEl.value.trim();
    const group    = groupEl.value.trim();
    const activity = activityEl.value.trim();
    const comments = commentsEl.value.trim();

    if (!name || !activity || !comments) {
      alert('Please fill in your name, what you are doing, and your comments.');
      return null;
    }

    saveParticipantInfo({ name, group });

    const now  = new Date();
    const note = {
      name, group, activity, comments,
      page:      getCurrentPageName(),
      date:      now.toLocaleDateString('en-US'),
      timestamp: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    const notes = getNotes();
    notes.push(note);
    saveNotes(notes);

    activityEl.value = '';
    commentsEl.value = '';
    renderNotesList();

    return note;
  }

  // save note
  document.getElementById('rita-save-btn').addEventListener('click', () => {
    buildAndSaveNote();
  });

  // send today's notes manually (button now lives in the right column footer)
  document.getElementById('rita-send-btn').addEventListener('click', () => {
    const today = new Date().toLocaleDateString('en-US');
    sendDailyDigest(today, true);
  });

});