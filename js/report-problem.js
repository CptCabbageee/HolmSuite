/* "Report a problem" on holmsuite.com (George, 2026-11-08: "I want the website to have the bug button. And allow people
 * to file a report without creating an account", "Email should be required").
 *
 * A small bug button in the bottom-right corner opens a form: what went wrong, plus an email address. It calls the suite's
 * signed-out report function as app 'site', which also requires the email (Holm migration
 * 20261108150000_suite_problem_reports_site.sql). Reports reach the Mender desk like every app's do; a fixed report
 * emails the reporter and holds their reward until they sign in with that address. The key below is the public
 * publishable key the Witstead web app already ships; the report function is the only thing it can write through.
 * Usage: <script src="/js/report-problem.js" defer></script> on any site-level page.
 */
(function () {
  var RPC = 'https://qnpccpkcudbdcxjardir.supabase.co/rest/v1/rpc/suite_report_problem_signed_out'
  var KEY = 'sb_publishable__BR4KD0PiXyfyf_jOie1Sw_CzD49Q5_'
  var MAX = 2000

  // The button takes the page's app colour, as in the apps (George, 2026-11-08: "make it the same color as the app"):
  // a demo page's --accent, otherwise Holmstead blue. The icon is white or near-black, whichever reads better on it.
  // Only the app demo pages' --accent is an app colour; other pages (support, privacy...) keep Holmstead blue.
  var accent = location.pathname.indexOf('/demo/') === 0 ? (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '').trim() : ''
  if (!/^#[0-9a-f]{6}$/i.test(accent)) accent = '#5FBCFF'
  function lum(hex) {
    var v = [1, 3, 5].map(function (i) { var c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
  }
  var L = lum(accent)
  var onAccent = 1.05 / (L + 0.05) >= (L + 0.05) / (lum('#0A0A0A') + 0.05) ? '#FFFFFF' : '#0A0A0A'

  var css =
    '.rp-fab{position:fixed;right:16px;bottom:16px;z-index:9500;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.18);' +
    'background:' + accent + ';color:' + onAccent + ';display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);touch-action:none}' +
    '.rp-fab.rp-snap{transition:left .25s ease,top .25s ease}.rp-fab.rp-dragging{cursor:grabbing;box-shadow:0 8px 24px rgba(0,0,0,.6)}' +
    '.rp-fab:hover{filter:brightness(1.12)}.rp-fab:focus-visible{outline:3px solid #fff;outline-offset:3px}' +
    '.rp-back{position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
    'display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.rp-card{width:100%;max-width:420px;background:#14171c;border:1px solid #2a2f37;border-radius:18px;padding:20px;color:#e5e7eb;' +
    'font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
    '.rp-card h2{margin:0 0 6px;font-size:18px}.rp-card p{margin:0 0 14px;font-size:13px;line-height:1.5;color:#c5cbd3}' +
    '.rp-card label{display:block;font-size:13px;font-weight:700;margin:10px 0 6px}' +
    '.rp-card textarea,.rp-card input{width:100%;box-sizing:border-box;background:#0d0f13;border:1px solid #333a44;border-radius:10px;' +
    'color:#fff;font:inherit;font-size:15px;padding:10px 12px}.rp-card textarea{min-height:110px;resize:vertical}' +
    '.rp-card textarea:focus,.rp-card input:focus{outline:none;border-color:' + accent + '}' +
    '.rp-count{font-size:11px;color:#9ca3af;text-align:right;margin-top:4px}' +
    '.rp-row{display:flex;gap:10px;margin-top:16px}.rp-row button{flex:1;border:0;border-radius:999px;padding:12px;font:inherit;' +
    'font-size:14px;font-weight:700;cursor:pointer}.rp-send{background:' + accent + ';color:' + onAccent + '}.rp-send[disabled]{opacity:.6;cursor:default}' +
    '.rp-cancel{background:#2a2f37;color:#e5e7eb}.rp-row button:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
    '.rp-msg{min-height:18px;font-size:13px;margin-top:10px;color:#fca5a5}.rp-msg.ok{color:#86efac}'
  var style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  var fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'rp-fab'
  fab.setAttribute('aria-label', 'Report a problem with this page')
  fab.setAttribute('data-testid', 'report-problem-fab')
  fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2l1.9 1.9M16 2l-1.9 1.9M9 7.1V6a3 3 0 1 1 6 0v1.1"/>' +
    '<path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6zM12 20v-9M6.5 13H3M21 13h-3.5M4 7l2.5 1.7M20 7l-2.5 1.7M4 19l2.6-1.5M20 19l-2.6-1.5"/></svg>'
  document.body.appendChild(fab)

  var back = null
  function close() {
    if (!back) return
    back.remove()
    back = null
    fab.focus()
  }

  function open() {
    if (back) return
    back = document.createElement('div')
    back.className = 'rp-back'
    back.innerHTML =
      '<form class="rp-card" role="dialog" aria-modal="true" aria-labelledby="rp-title" novalidate>' +
      '<h2 id="rp-title">Report a problem</h2>' +
      '<p>Tell us what went wrong on this page. No account needed. We only use your email to tell you when it’s fixed, ' +
      'and if it is, there’s a Holmstead Credits reward waiting when you sign up with the same email.</p>' +
      '<label for="rp-text">What went wrong?</label>' +
      '<textarea id="rp-text" maxlength="' + MAX + '" required data-testid="report-problem-text"></textarea>' +
      '<div class="rp-count" id="rp-count" aria-live="polite">0 / ' + MAX + '</div>' +
      '<label for="rp-email">Your email</label>' +
      '<input id="rp-email" type="email" autocomplete="email" inputmode="email" required data-testid="report-problem-email">' +
      '<div class="rp-msg" id="rp-msg" role="status" aria-live="polite"></div>' +
      '<div class="rp-row"><button type="button" class="rp-cancel" data-testid="report-problem-cancel">Cancel</button>' +
      '<button type="submit" class="rp-send" data-testid="report-problem-send">Send report</button></div>' +
      '</form>'
    document.body.appendChild(back)
    var form = back.querySelector('form')
    var text = back.querySelector('#rp-text')
    var email = back.querySelector('#rp-email')
    var msg = back.querySelector('#rp-msg')
    var send = back.querySelector('.rp-send')
    var count = back.querySelector('#rp-count')
    text.focus()

    text.addEventListener('input', function () { count.textContent = text.value.length + ' / ' + MAX })
    back.addEventListener('click', function (e) { if (e.target === back) close() })
    back.querySelector('.rp-cancel').addEventListener('click', close)
    back.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') { // keep the keyboard inside the form
        var f = back.querySelectorAll('textarea,input,button')
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    })

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      msg.className = 'rp-msg'
      var t = text.value.trim(), m = email.value.trim()
      if (!t) { msg.textContent = 'Please say what went wrong.'; text.focus(); return }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { msg.textContent = 'Please enter your email address.'; email.focus(); return }
      send.disabled = true
      send.textContent = 'Sending…'
      fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY },
        body: JSON.stringify({
          p_app: 'site', p_route: location.pathname.slice(0, 200), p_app_version: 'web',
          p_platform: navigator.userAgent.slice(0, 300), p_message: t, p_screenshot_path: null,
          p_email_opt_in: true, p_contact_email: m
        })
      }).then(function (r) { return r.json().catch(function () { return {} }) }).then(function (res) {
        if (res && res.ok) {
          msg.className = 'rp-msg ok'
          msg.textContent = 'Thanks, it’s sent. We’ll email you when it’s fixed.'
          send.textContent = 'Sent'
          setTimeout(close, 2500)
          return
        }
        var why = res && res.reason
        msg.textContent = why === 'rate_limited' ? 'We’ve had a lot of reports today. Please try again tomorrow.'
          : why === 'bad_email' ? 'That email address doesn’t look right.'
          : why === 'too_long' ? 'That’s a bit long. Please shorten it.'
          : 'Sorry, that didn’t send. Please try again in a moment.'
        send.disabled = false
        send.textContent = 'Send report'
      }).catch(function () {
        msg.textContent = 'Sorry, that didn’t send. Check your connection and try again.'
        send.disabled = false
        send.textContent = 'Send report'
      })
    })
  }

  // Drag to move, as in the apps (George, 2026-11-08: "You can't drag it like you can in the apps"; the apps' rules are
// Holm packages/shared/hooks/useDraggableFab.ts). A move of more than 8px is a drag, anything shorter a tap. On release
// it snaps to the nearer side, kept below the nav bar, and the spot is remembered in this browser. Until it's dragged
// it sits bottom-right; screen readers and keyboards just press it.
  var SIZE = 48, EDGE = 16, SPOT = 'holm-report-fab-spot'
  function topLimit() { var nav = document.querySelector('.hn'); return (nav ? nav.getBoundingClientRect().bottom : 0) + 12 }
  function place(side, y) {
    var maxY = window.innerHeight - SIZE - EDGE
    y = Math.min(maxY, Math.max(topLimit(), y))
    fab.style.right = 'auto'; fab.style.bottom = 'auto'
    fab.style.left = (side === 'left' ? EDGE : window.innerWidth - EDGE - SIZE) + 'px'
    fab.style.top = y + 'px'
    return y
  }
  var spot = null
  try { spot = JSON.parse(localStorage.getItem(SPOT) || 'null') } catch (e) { spot = null }
  if (spot && (spot.side === 'left' || spot.side === 'right') && typeof spot.y === 'number') place(spot.side, spot.y)
  window.addEventListener('resize', function () { if (spot) place(spot.side, spot.y) })

  var start = null, dragged = false
  fab.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return
    var r = fab.getBoundingClientRect()
    start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, id: e.pointerId }
    dragged = false
  })
  fab.addEventListener('pointermove', function (e) {
    if (!start || e.pointerId !== start.id) return
    var dx = e.clientX - start.x, dy = e.clientY - start.y
    if (!dragged && Math.hypot(dx, dy) <= 8) return
    if (!dragged) { dragged = true; fab.setPointerCapture(e.pointerId); fab.classList.remove('rp-snap'); fab.classList.add('rp-dragging') }
    fab.style.right = 'auto'; fab.style.bottom = 'auto'
    fab.style.left = Math.min(window.innerWidth - SIZE, Math.max(0, start.left + dx)) + 'px'
    fab.style.top = Math.min(window.innerHeight - SIZE, Math.max(0, start.top + dy)) + 'px'
  })
  function release() {
    if (!start) return
    start = null
    if (!dragged) return
    var r = fab.getBoundingClientRect()
    var side = r.left + SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right'
    fab.classList.remove('rp-dragging'); fab.classList.add('rp-snap')
    spot = { side: side, y: place(side, r.top) }
    try { localStorage.setItem(SPOT, JSON.stringify(spot)) } catch (e) { /* remembered for this visit only */ }
  }
  fab.addEventListener('pointerup', release)
  fab.addEventListener('pointercancel', release)

  fab.addEventListener('click', function (e) {
    if (dragged) { dragged = false; e.preventDefault(); return } // the end of a drag isn't a tap
    open()
  })
})()
