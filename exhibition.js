// // exhibition.js

// (function () {

//   // config

//   var ROOT_PATH        = (function () {
//     return window.location.pathname.indexOf('/districts/') !== -1 ? '../' : '';
//   })();


//   // inject css once

//   (function injectStyles() {
//     if (document.getElementById('exhibition-styles')) return;
//     var css = [

//       '.exhibition-print-row {',
//       '  display: flex;',
//       '  gap: 0.75rem;',
//       '  justify-content: center;',
//       '  margin-top: 0.5rem;',
//       '}',
//       '.exhibition-print-btn {',
//       '  font-family: var(--font-whois, monospace);',
//       '  font-size: 0.82rem;',
//       '  letter-spacing: 0.04em;',
//       '  padding: 0.6rem 1.5rem;',
//       '  background: white;',
//       '  border: none;',
//       '  cursor: pointer;',
//       '  transition: opacity 0.2s;',
//       '}',
//       '.shrine-screen      .exhibition-print-btn { color: var(--color-shrine, #DD6204); }',
//       '.garden-screen      .exhibition-print-btn { color: var(--color-garden, #6A6405); }',
//       '.cornerstore-screen .exhibition-print-btn { color: var(--color-cornerstore, #D05038); }',
//       '.tower-screen       .exhibition-print-btn { color: var(--color-tower, #205A97); }',
//       '.plaza-screen       .exhibition-print-btn { color: var(--color-plaza, #64436d); }',
//       '.exhibition-print-btn:hover { opacity: 0.8; }',

//     ].join('\n');

//     var style = document.createElement('style');
//     style.id = 'exhibition-styles';
//     style.textContent = css;
//     (document.head || document.documentElement).appendChild(style);
//   })();


//   // district completion print buttons

//   var DISTRICT_NAMES = {
//     shrine:      'The Shrine',
//     garden:      'The Garden',
//     cornerstore: 'The Cornerstore',
//     tower:       'The Tower',
//     plaza:       'The Plaza',
//   };

//   var DISTRICT_EMOTIONS = {
//     shrine:      'Reverence',
//     garden:      'Growth',
//     cornerstore: 'Routine',
//     tower:       'Solitude',
//     plaza:       'Community',
//   };

//   var QUESTIONS = {
//     shrine:      ["What place comes to mind?","What did this place hold that was precious to you?","How do you return to this place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, give your shrine a name."],
//     garden:      ["What place comes to mind?","What were you becoming in this place?","How did the growth happen? What did it feel like?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your garden a name."],
//     cornerstore: ["What place comes to mind?","What was your routine in this place?","What drew you to this specific place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your cornerstore a name."],
//     tower:       ["What place comes to mind?","What was your relationship with solitude in this space?","What perspective did being alone give you?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your tower a name."],
//     plaza:       ["What place comes to mind?","Who else was in this place? How did you connect with them?","What brought you together in this place?","When you think of this place, what do you remember?","If this place were to fade from memory completely, what would be lost?","Finally, please give your plaza a name."],
//   };

//   function detectCurrentDistrict() {
//     var path = window.location.pathname;
//     var names = Object.keys(DISTRICT_NAMES);
//     for (var i = 0; i < names.length; i++) {
//       if (path.indexOf(names[i]) !== -1) return names[i];
//     }
//     return null;
//   }

//   function printThisDistrict(districtKey) {
//     try { sessionStorage.setItem('print-district-mode', districtKey); } catch (e) {}
//     if (typeof window.navigateWithLoader === 'function') {
//       window.navigateWithLoader(ROOT_PATH + 'print.html');
//     } else {
//       window.location.href = ROOT_PATH + 'print.html';
//     }
//   }

//   function printWholeCityFromDistrict() {
//     if (typeof window.navigateWithLoader === 'function') {
//       window.navigateWithLoader(ROOT_PATH + 'print.html');
//     } else {
//       window.location.href = ROOT_PATH + 'print.html';
//     }
//   }

//   function _openPrintWindow(title, text) {
//     var w = window.open('', '_blank', 'width=600,height=700');
//     if (!w) { alert('Allow popups to print.'); return; }
//     w.document.write([
//       '<!DOCTYPE html><html><head><meta charset="UTF-8">',
//       '<title>' + title + '</title>',
//       '<style>',
//       '  body { font-family: monospace; font-size: 13px; line-height: 1.7;',
//       '         max-width: 480px; margin: 2rem auto; color: #0c2177; white-space: pre-wrap; }',
//       '  @media print { body { margin: 0; } }',
//       '</style></head><body>',
//       '<pre>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>',
//       '<script>window.onload = function() { window.print(); }<\/script>',
//       '</body></html>',
//     ].join(''));
//     w.document.close();
//   }

//   function injectCompletionPrintButtons(districtKey) {
//     var container = document.querySelector('.completion-container');
//     if (!container) return;
//     if (container.querySelector('.exhibition-print-row')) return;

//     var row = document.createElement('div');
//     row.className = 'exhibition-print-row';

//     var btnDistrict = document.createElement('button');
//     btnDistrict.className   = 'exhibition-print-btn mono';
//     btnDistrict.textContent = 'Print this district';
//     btnDistrict.addEventListener('click', function () { printThisDistrict(districtKey); });

//     var btnCity = document.createElement('button');
//     btnCity.className   = 'exhibition-print-btn mono';
//     btnCity.textContent = 'Print whole city';
//     btnCity.addEventListener('click', printWholeCityFromDistrict);

//     row.appendChild(btnDistrict);
//     row.appendChild(btnCity);
//     container.appendChild(row);
//   }

//   function watchForCompletionScreen(districtKey) {
//     if (!districtKey) return;

//     var completionId = districtKey + '-completion';

//     function tryInject() {
//       var screen = document.getElementById(completionId);
//       if (screen && !screen.classList.contains('hidden')) {
//         injectCompletionPrintButtons(districtKey);
//       }
//     }

//     tryInject();

//     var observer = new MutationObserver(function (mutations) {
//       mutations.forEach(function (m) {
//         if (m.type === 'attributes' && m.attributeName === 'class') {
//           tryInject();
//         }
//       });
//     });

//     var wrapper = document.getElementById('district-content');
//     if (wrapper) {
//       observer.observe(wrapper, { attributes: true, subtree: true });
//     }
//   }

//   document.addEventListener('DOMContentLoaded', function () {
//     var districtKey = detectCurrentDistrict();
//     if (districtKey) watchForCompletionScreen(districtKey);
//   });

// })();