/*
 * Launch alerts sign-up, for every app's demo page (George, 2026-10-22: "Provide the ability to sign up for
 * launch alerts on this page, with the page's name auto ticked, but all other apps available, with
 * descriptions ... make sure it is the case for every demo page").
 *
 * Use on a page:
 *   <div data-launch-alerts data-app="block" data-accent="#F800F5"></div>
 *   <script src="/js/launch-alerts.js" defer></script>
 *
 * data-app is the page's own app key (Holm's per-app string keys): it is ticked to start with and listed first.
 * Posts to the same Holm edge function and Turnstile widget as the homepage form (index.html #launch-alerts);
 * keep the APPS list here, the homepage form, and Holm's suite-launch-alerts function/migration in step when an
 * app is added (Holm handoffs/launch-alerts.md).
 */
(function () {
  'use strict'
  var ENDPOINT = 'https://qnpccpkcudbdcxjardir.supabase.co/functions/v1/suite-launch-alerts'
  var SITE_KEY = '0x4AAAAAAEx6Dg-Ua-Q9Inqv'
  var APPS = [
    { key: 'marq', logo: 'waystead', name: 'Waystead', desc: 'Reminders that go off when you arrive somewhere, or leave.' },
    { key: 'vim', logo: 'wordstead', name: 'Wordstead', desc: 'A corkboard of notes, with your calendar built in.' },
    { key: 'brood', logo: 'broodstead', name: 'Broodstead', desc: 'Family jobs, with XP, levels and rewards for kids.' },
    { key: 'vial', logo: 'healstead', name: 'Healstead', desc: 'Keep on top of your medicines, doses and refills.' },
    { key: 'peer', logo: 'gradestead', name: 'Gradestead', desc: 'Find study partners and chat safely in groups.' },
    { key: 'block', logo: 'blockstead', name: 'Blockstead', desc: 'Only the people you choose get through.', android: true },
    { key: 'holm', logo: 'holmstead', name: 'Holmstead Hub', desc: 'One home, one account and one wallet for every app.' },
    { key: 'klu', logo: 'witstead', name: 'Witstead', desc: 'A fresh set of brain puzzles every day. The phone app; you can already play on the web.' }
  ]

  var CSS = '' +
    '.la{background:#131313;border:1px solid #262626;border-radius:22px;padding:20px 16px;color:#F3F4F6;font-family:inherit}' +
    '.la h3{font-size:16px;font-weight:800;margin:0 0 6px}' +
    '.la>p{font-size:12px;color:#9CA3AF;line-height:1.7;margin:0 0 14px}' +
    '.la fieldset{border:0;margin:0 0 14px;padding:0;min-width:0}' +
    '.la legend{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;padding:0}' +
    '.la .opts{display:flex;flex-direction:column;gap:8px}' +
    '.la label.opt{display:flex;gap:12px;align-items:flex-start;background:#1A1A1A;border:1.5px solid #262626;border-radius:14px;padding:11px 12px;cursor:pointer;min-height:48px;transition:border-color .15s,background .15s}' +
    '.la label.opt:has(input:checked){border-color:var(--la-accent);background:var(--la-soft)}' +
    '.la .lg{width:34px;height:34px;border-radius:9px;flex:none;display:block}' +
    '.la .stack{position:relative;width:34px;height:34px;flex:none}' +
    '.la .stack img{position:absolute;width:22px;height:22px;border-radius:6px;border:1.5px solid #1A1A1A}' +
    '.la .stack img:nth-child(1){left:0;top:0}.la .stack img:nth-child(2){left:12px;top:6px}.la .stack img:nth-child(3){left:6px;top:13px}' +
    '.la label.opt{align-items:center}' +
    '.la input[type=checkbox]{width:20px;height:20px;margin:1px 0 0;flex:none;accent-color:var(--la-accent)}' +
    '.la .nm{font-size:12.5px;font-weight:700;display:block}' +
    '.la .ds{font-size:11px;color:#9CA3AF;line-height:1.55;display:block;margin-top:2px}' +
    '.la .this{display:inline-block;font-size:9.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;background:var(--la-accent);color:#000;border-radius:99px;padding:2px 7px;margin-left:6px;vertical-align:1px}' +
    '.la .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.la .more{border:0;background:none;color:#9CA3AF;font:inherit;font-size:11.5px;padding:8px 2px;cursor:pointer;text-decoration:underline}' +
    '.la .email{width:100%;box-sizing:border-box;font:inherit;font-size:14px;padding:13px 14px;border-radius:12px;border:1.5px solid #333;background:#0A0A0A;color:#F3F4F6;margin-bottom:12px}' +
    '.la .email:focus{outline:none;border-color:var(--la-accent)}' +
    '.la .go{width:100%;border:0;border-radius:99px;background:var(--la-accent);color:#000;font:inherit;font-size:13px;font-weight:800;padding:14px;min-height:48px;cursor:pointer}' +
    '.la .go:disabled{opacity:.6;cursor:wait}' +
    '.la .msg{font-size:12px;font-weight:700;margin:12px 0 0;min-height:1em;line-height:1.6}' +
    '.la .msg.ok{color:#34D399}' +
    '.la .small{font-size:10.5px;color:#9CA3AF;line-height:1.7;margin:12px 0 0}' +
    '.la .small a{color:#9CA3AF}' +
    '.la .ts{margin-bottom:8px}'

  function el(tag, attrs, html) {
    var e = document.createElement(tag)
    for (var k in attrs) e.setAttribute(k, attrs[k])
    if (html != null) e.innerHTML = html
    return e
  }
  function rgba(hex, a) {
    var h = (hex || '#F800F5').replace('#', '')
    if (h.length === 3) h = h.split('').map(function (c) { return c + c }).join('')
    var n = parseInt(h, 16)
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'
  }

  var loading = null
  function turnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile)
    if (!loading) loading = new Promise(function (res, rej) {
      var s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true; s.onload = function () { res(window.turnstile) }; s.onerror = rej
      document.head.appendChild(s)
    })
    return loading
  }

  function mount(host, n) {
    var own = host.getAttribute('data-app')
    var accent = host.getAttribute('data-accent') || '#F800F5'
    var id = 'la' + n
    var mine = APPS.filter(function (a) { return a.key === own })[0]
    var others = APPS.filter(function (a) { return a.key !== own })

    var box = el('section', { 'class': 'la', 'aria-labelledby': id + '-t' })
    box.style.setProperty('--la-accent', accent)
    box.style.setProperty('--la-soft', rgba(accent, 0.1))
    box.innerHTML =
      '<h3 id="' + id + '-t">' + (mine ? 'Tell me when ' + mine.name + ' is out' : 'Get an email when an app comes out') + '</h3>' +
      '<p>One email when each app you pick is ready to download. Nothing else.</p>'

    var form = el('form', { novalidate: '' })
    var fsA = el('fieldset'); fsA.appendChild(el('legend', {}, 'Which apps?'))
    var opts = el('div', { 'class': 'opts' })
    function opt(a, checked, isThis) {
      var l = el('label', { 'class': 'opt' })
      l.innerHTML = '<input type="checkbox" name="la-app" value="' + a.key + '" id="' + id + '-app-' + a.key + '"' + (checked ? ' checked' : '') + '>' +
        (a.logo ? '<img class="lg" src="/images/email/' + a.logo + '.png" width="34" height="34" alt="">' :
          a.stack ? '<span class="stack" aria-hidden="true">' + a.stack.map(function (l) { return '<img src="/images/email/' + l + '.png" alt="">' }).join('') + '</span>' : '') +
        '<span><span class="nm">' + a.name + (isThis ? '<span class="this">This app</span>' : '') + '</span>' +
        '<span class="ds">' + a.desc + (a.android ? ' Android only.' : '') + '</span></span>'
      return l
    }
    if (mine) opts.appendChild(opt(mine, true, true))
    var rest = el('div', { 'class': 'opts', id: id + '-rest' })
    others.forEach(function (a) { rest.appendChild(opt(a, false, false)) })
    var allL = opt({ key: 'all', stack: ['waystead', 'witstead', 'blockstead'], name: 'All of them', desc: 'Every Holmstead app, including ones not announced yet.' }, false, false)
    rest.appendChild(allL)
    fsA.appendChild(opts)
    if (mine) fsA.appendChild(el('p', { 'class': 'ds', style: 'margin:12px 2px 8px' }, 'Other Holmstead apps:'))
    fsA.appendChild(rest)
    form.appendChild(fsA)

    var fsP = el('fieldset'); fsP.appendChild(el('legend', {}, 'Which phone?'))
    var row = el('div', { 'class': 'row' })
    row.innerHTML =
      '<label class="opt"><input type="checkbox" name="la-platform" value="android" id="' + id + '-android"' + (mine && mine.android ? ' checked' : '') + '><span><span class="nm">Android</span></span></label>' +
      '<label class="opt"><input type="checkbox" name="la-platform" value="ios" id="' + id + '-ios"><span><span class="nm">iPhone</span></span></label>'
    fsP.appendChild(row); form.appendChild(fsP)

    form.appendChild(el('label', { 'for': id + '-email', 'class': 'nm', style: 'margin-bottom:6px;display:block' }, 'Your email'))
    var email = el('input', { type: 'email', id: id + '-email', 'class': 'email', autocomplete: 'email', maxlength: '254', placeholder: 'you@example.com', required: '' })
    form.appendChild(email)
    var ts = el('div', { 'class': 'ts', id: id + '-ts' }); form.appendChild(ts)
    var btn = el('button', { type: 'submit', 'class': 'go', id: id + '-submit' }, 'Email me when it’s out')
    form.appendChild(btn)
    var msg = el('p', { 'class': 'msg', role: 'status', 'aria-live': 'polite' }); form.appendChild(msg)
    form.appendChild(el('p', { 'class': 'small' },
      'We’ll send a link to confirm first. We keep your email, the apps and phones you pick, and when you signed up and ' +
      'confirmed, and use them only for these emails. Every email has a link to stop them, which deletes your details. ' +
      'If you don’t confirm, we delete them after 7 days. <a href="/privacy#launch-alerts">Privacy</a>'))
    box.appendChild(form)
    host.appendChild(box)

    var all = form.querySelector('input[value=all]')
    var apps = form.querySelectorAll('input[name=la-app]:not([value=all])')
    all.addEventListener('change', function () { apps.forEach(function (a) { a.checked = all.checked }) })
    apps.forEach(function (a) { a.addEventListener('change', function () { if (!a.checked) all.checked = false }) })

    function say(t, ok) { msg.textContent = t; msg.className = 'msg' + (ok ? ' ok' : '') }
    function picked(name) {
      return Array.prototype.map.call(form.querySelectorAll('input[name=' + name + ']:checked'), function (i) { return i.value })
    }
    var widget = null
    function send(token) {
      var chosen = all.checked ? ['all'] : picked('la-app').filter(function (v) { return v !== 'all' })
      fetch(ENDPOINT, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'signup', email: email.value.trim(), apps: chosen, platforms: picked('la-platform'), turnstile: token })
      }).then(function (r) { return r.json().catch(function () { return {} }) }).then(function (out) {
        var s = out && out.status
        if (s === 'ok') { say('Nearly done: check your inbox for a link to confirm.', true); email.value = '' }
        else if (s === 'bad_email') say('That email address doesn’t look right. Please check it.')
        else if (s === 'bad_choice') say('Pick at least one app and one phone.')
        else if (s === 'check_failed') say('We couldn’t check you’re not a robot. Please try again.')
        else if (s === 'busy') say('Lots of sign-ups today. Please try again tomorrow.')
        else say('Something went wrong. Please try again.')
      }).catch(function () { say('Something went wrong. Please try again.') })
        .then(function () { btn.disabled = false; if (window.turnstile && widget !== null) window.turnstile.reset(widget) })
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      if (!email.value.trim()) return say('Please enter your email.')
      if ((!all.checked && picked('la-app').length === 0) || picked('la-platform').length === 0) return say('Pick at least one app and one phone.')
      btn.disabled = true; say('Sending…')
      turnstile().then(function (t) {
        if (widget === null) widget = t.render('#' + id + '-ts', {
          sitekey: SITE_KEY, execution: 'execute', callback: send,
          'error-callback': function () { btn.disabled = false; say('We couldn’t check you’re not a robot. Please try again.') }
        })
        t.execute(widget)
      }, function () { btn.disabled = false; say('Couldn’t load the robot check. Please try again.') })
    })
  }

  function init() {
    if (!document.getElementById('la-shared-css')) {
      var st = document.createElement('style'); st.id = 'la-shared-css'; st.textContent = CSS; document.head.appendChild(st)
    }
    var hosts = document.querySelectorAll('[data-launch-alerts]')
    for (var i = 0; i < hosts.length; i++) if (!hosts[i].firstChild) mount(hosts[i], i)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
