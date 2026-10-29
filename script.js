const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = $('#hero'), photo = $('#photo'), cv = $('#cv'), ctx = cv.getContext('2d');

/* ---------- заголовок по літерах ---------- */
(() => {
  let i = 0;
  document.querySelectorAll('#title .ln').forEach(ln => {
    const wrap = (node, out) => node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i++); w.append(s); });
          out.append(w);
        });
      } else { const c = n.cloneNode(false); wrap(n, c); out.append(c); }
    });
    const out = document.createDocumentFragment(); wrap(ln, out); ln.replaceChildren(out);
  });
})();

/* ---------- шапка: фіксована, зі скляною підкладкою після прокрутки ---------- */
const bar = $('#top');
const stick = () => bar.classList.toggle('is-stuck', scrollY > 24);
addEventListener('scroll', stick, { passive: true }); stick();

/* ---------- меню ---------- */
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => {
  if (e.target.closest('a')) { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
});

/* ---------- слова: хаос → порядок ---------- */
const WORDS = ['ПДВ', 'ЄСВ', 'ЄП', 'P&L', 'Cashflow', 'Balance', '1 240,50', '₴ 85 000', 'Акт', 'Рахунок', 'Звіт', 'КВЕД', 'ПРРО', 'ПДФО',
  'Накладна', 'Баланс', '−12%', '+24%', 'Q3', 'Виписка', 'Табель', 'Дебет', 'Кредит', 'ФОП', 'ТОВ', 'Договір', '3 пр.'];
let W = 0, H = 0, dpr = 1, G = 110, TOP = 90, XM = 600, tokens = [];
const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
let lastMove = -1e9, moved = false, R = 260;

function resize() {
  dpr = Math.min(2, devicePixelRatio || 1);
  W = hero.clientWidth; H = hero.clientHeight;
  TOP = $('.top').offsetHeight + 8;   // нижня межа шапки (вона фіксована)
  cv.width = W * dpr; cv.height = H * dpr;
  G = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--G')) || 110;
  XM = Math.max(photo.offsetLeft + photo.offsetWidth * .2, W * (W < 700 ? .45 : .3));   // права межа: слова не заходять на фото
  const n = Math.max(24, Math.min(80, Math.round(XM * H / 9000)));
  tokens = Array.from({ length: n }, (_, i) => ({
    x: Math.random() * XM, y: TOP + Math.random() * (H - TOP),
    vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
    rot: (Math.random() - .5) * 1.1, size: 12 + (Math.random() * 9 | 0),
    t: WORDS[i % WORDS.length], s: 0
  }));
  if (!moved) { const f = faceFront(); cur.x = tgt.x = f.x; cur.y = tgt.y = f.y; }
}

// точка просто перед обличчям (воно дивиться ліворуч)
function faceFront() {
  return { x: XM - W * .14, y: H * .3 };
}

function setPointer(e) {
  const r = hero.getBoundingClientRect();
  tgt.x = e.clientX - r.left; tgt.y = e.clientY - r.top;
  lastMove = performance.now();
  if (!moved) { moved = true; $('#hint').classList.add('gone'); }
}
hero.addEventListener('pointermove', setPointer);
hero.addEventListener('pointerdown', setPointer);

if (matchMedia('(hover: none)').matches) $('#hintTxt').textContent = 'Торкніться екрана — наведіть лад';

function frame(t) {
  // якщо користувач не рухає курсором — промінь сам «гуляє»
  if (t - lastMove > 3500) {
    const f = faceFront();
    tgt.x = f.x + Math.cos(t / 1700) * W * .13;
    tgt.y = f.y + Math.sin(t / 1100) * H * .12;
  }
  cur.x += (tgt.x - cur.x) * .12; cur.y += (tgt.y - cur.y) * .12;
  R = Math.min(290, Math.max(170, W * .17)) * (1 + .05 * Math.sin(t / 520));

  hero.style.setProperty('--mx', cur.x + 'px'); hero.style.setProperty('--my', cur.y + 'px');
  hero.style.setProperty('--px', (cur.x - photo.offsetLeft) + 'px'); hero.style.setProperty('--py', (cur.y - photo.offsetTop) + 'px');
  hero.style.setProperty('--r', R + 'px');
  draw();
  if (!reduced) requestAnimationFrame(frame);
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const taken = new Set();
  for (const k of tokens) {
    const d = Math.hypot(k.x - cur.x, k.y - cur.y);
    const want = Math.max(0, Math.min(1, (1 - d / R) * 1.7));
    k.s += (want - k.s) * .14;
    const move = reduced ? 0 : 1 - k.s;           // у промені слова завмирають і вишиковуються
    k.x += k.vx * move; k.y += k.vy * move;
    if (k.x < -60) k.x = XM; if (k.x > XM) k.x = -60;
    if (k.y < TOP - 30) k.y = H + 30; if (k.y > H + 30) k.y = TOP - 30;

    let gx = Math.round(k.x / G) * G, gy = Math.round(k.y / G) * G;
    if (k.s > .35) { let tries = 0; while (taken.has(gx + ':' + gy) && tries++ < 3) gx += G; taken.add(gx + ':' + gy); }
    const s = k.s, x = k.x + (gx + G / 2 - k.x) * s, y = k.y + (gy + G / 2 - k.y) * s;

    ctx.save(); ctx.translate(x, y); ctx.rotate(k.rot * (1 - s));
    ctx.font = `600 ${k.size * (1 + s * .25)}px Montserrat, sans-serif`;
    const edge = Math.max(0, Math.min(1, (y - TOP) / 40));   // біля шапки слова згасають
    const side = Math.max(0, Math.min(1, (XM - x) / 80));    // біля фото слова згасають
    const a = (.2 + .8 * s) * edge * side;
    ctx.fillStyle = `rgba(${255 - 4 * s | 0},${255 - 151 * s | 0},${255 - 202 * s | 0},${a})`;
    ctx.fillText(k.t, 0, 0); ctx.restore();
  }
  // «лінза» навколо курсора
  ctx.save(); ctx.strokeStyle = 'rgba(251,104,53,.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 7]);
  ctx.beginPath(); ctx.arc(cur.x, cur.y, R * .72, 0, 7); ctx.stroke(); ctx.restore();
}

addEventListener('resize', resize);
resize();
if (reduced) { const f = faceFront(); cur.x = f.x; cur.y = f.y; hero.style.setProperty('--px', (cur.x - photo.offsetLeft) + 'px'); hero.style.setProperty('--py', (cur.y - photo.offsetTop) + 'px'); draw(); }
else requestAnimationFrame(frame);

/* ---------- поява блоків при скролі ---------- */
document.documentElement.classList.add('js');
(() => {
  const els = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  els.forEach(e => io.observe(e));
})();

/* ---------- відео в оранжевому блоці: грає лише в зоні видимості ---------- */
(() => {
  const v = document.querySelector('.pain__video'); if (!v) return;
  if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
  new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { threshold: .05 }).observe(v);
})();

/* ---------- послуги: підсвітка картки за курсором + перемикач ФОП | ТОВ ---------- */
document.querySelectorAll('.svc-card').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));
(() => {
  const seg = $('#seg'), menuEl = $('#scopeMenu'), detail = $('#scopeDetail'); if (!seg || !menuEl) return;
  const DATA = {
    fop: { label: 'ФОП', items: [
      ['Реєстрація', 'Відкриваємо ФОП для послуг, торгівлі чи виробництва.', ['Допомога з вибором системи оподаткування', 'Підготовка та подання документів', 'Постановка на облік']],
      ['Щомісячний супровід', 'Єдиний податок 2, 3, 4 груп, з ПДВ і без.', ['Оформлення первинних документів', 'Ведення бази та облік операцій', 'Здача звітів вчасно', 'Нарахування й сплата податків']],
      ['Кадровий облік', 'Порядок у кадрових документах і зарплаті.', ['Кадрові документи та табелі', 'Нарахування зарплати', 'Податки із зарплати']],
      ['Фінансовий супровід', 'Цифри, які зрозуміло показують стан справ.', ['Прибутки й збитки (P&L)', 'Рух грошей (Cash Flow)', 'Пояснення простими словами']],
      ['Фінансовий моніторинг', 'Допомагаємо з вимогами та нестандартними запитами.', ['Консультації за вашим випадком', 'Підготовка необхідних документів', 'Пошук варіантів рішення']],
      ['Закриття ФОП', 'Акуратно завершуємо діяльність без «хвостів».', ['Завершальна звітність', 'Розрахунки з бюджетом', 'Зняття з обліку']]
    ] },
    tov: { label: 'ТОВ', items: [
      ['Бухгалтерський супровід', 'Облік і звітність на загальній системі або єдиному податку.', ['ПДВ, експорт та інші особливості', 'Первинні документи', 'Звітність і податки']],
      ['ПДВ', 'Облік і звітність з ПДВ без пропущених термінів.', ['Податкові накладні', 'Декларації та звітність', 'Контроль термінів']],
      ['Клієнт-банк', 'Щоденна робота з рахунками компанії.', ['Платежі та виписки', 'Звірка з банком', 'Облік руху коштів']],
      ['Зарплата та кадри', 'Нарахування й кадровий облік для команди.', ['Нарахування зарплати', 'Податки із зарплати', 'Кадрові документи']],
      ['Управлінський облік', 'Інструменти, за якими керують бізнесом.', ['Управлінські документи', 'Бланки для систематизації процесів', 'Звіти P&L, Cash Flow, Balance']],
      ['Ревізія обліку', 'Перевіряємо чинний облік і знаходимо слабкі місця.', ['Аналіз бухгалтерського обліку', 'Виявлення недоліків і порушень', 'План виправлення']]
    ] }
  };
  const btns = [...seg.querySelectorAll('button')], mobile = matchMedia('(max-width:900px)');
  let tab = 'fop', cur = 0;

  const place = b => { seg.style.setProperty('--tx', b.offsetLeft - 4 + 'px'); seg.style.setProperty('--tw', b.offsetWidth + 'px'); };
  const esc = s => s.replace(/&/g, '&amp;');
  function renderMenu() {
    menuEl.innerHTML = DATA[tab].items.map((it, i) => `<button type="button" role="tab" aria-selected="${i === cur}" data-i="${i}" style="--i:${i}"><span class="scope__n">${String(i + 1).padStart(2, '0')}</span><span>${esc(it[0])}</span></button>`).join('');
  }
  function renderDetail(animate) {
    const d = DATA[tab], it = d.items[cur];
    detail.innerHTML = `<p class="scope__tag">${d.label} · ${String(cur + 1).padStart(2, '0')}</p><h3>${esc(it[0])}</h3><p class="scope__desc">${esc(it[1])}</p><ul>${it[2].map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join('')}</ul><a class="btn btn--lg" href="#lead" data-open="lead" data-service="${d.label}: ${esc(it[0])}">Обговорити цю послугу</a>`;
    if (animate) { detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap'); }
  }
  function layout() {
    const scope = seg.closest('.scope');
    if (mobile.matches) { const a = menuEl.querySelector('[aria-selected="true"]'); a && a.after(detail); }
    else if (detail.parentElement !== scope) scope.append(detail);
  }
  function pickTab(b) {
    tab = b.dataset.t; cur = 0;
    btns.forEach(x => x.setAttribute('aria-selected', x === b)); place(b);
    renderMenu(); renderDetail(true); layout();
  }
  btns.forEach(b => b.addEventListener('click', () => pickTab(b)));
  menuEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    cur = +b.dataset.i;
    menuEl.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b));
    renderDetail(true); layout();
  });
  mobile.addEventListener('change', layout);
  addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-selected') === 'true')));
  document.fonts && document.fonts.ready.then(() => place(btns[0]));
  renderMenu(); renderDetail(false); layout(); place(btns[0]);
})();

/* ---------- маніфест: слова «загоряються» під час прокрутки ---------- */
const mani = $('#maniBig');
if (mani) {
  const words = mani.textContent.trim().split(/\s+/);
  mani.setAttribute('aria-label', words.join(' '));
  mani.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span'), t = document.createElement('span');
    s.className = 'wd' + (/ілюзія/i.test(w) ? ' hl' : ''); t.className = 'wd__i'; t.style.setProperty('--i', i); t.textContent = w;
    s.append(t); mani.append(s, ' ');
  });
  // слова висуваються знизу, коли фраза з'являється на екрані; підсвічування йде за прокруткою
  if (reduced || !('IntersectionObserver' in window)) mani.classList.add('rise');
  else new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { mani.classList.add('rise'); io.disconnect(); } }), { threshold: .4 }).observe(mani);
}

/* ---------- процес: лінія та кроки наповнюються під час прокрутки ---------- */
const flowList = $('#flowList');
function onScroll() {
  const vh = innerHeight;
  if (mani) {
    const spans = mani.querySelectorAll('.wd'), r = mani.getBoundingClientRect();
    const p = reduced ? 1 : Math.max(0, Math.min(1, (vh * .82 - r.top) / (vh * .5 + r.height * .6)));
    const n = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
  }
  if (flowList) {
    const r = flowList.getBoundingClientRect(), mid = vh * .55, box = flowList.closest('.flow__in');
    const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    box.style.setProperty('--p', p);                                   // лінія й крапка
    box.style.setProperty('--fp', reduced ? 1 : Math.min(1, p * 1.3)); // різкість фото
    const steps = [...flowList.querySelectorAll('.step')];
    steps.forEach(st => st.classList.toggle('on', st.getBoundingClientRect().top < mid));
    const on = steps.filter(s => s.classList.contains('on')), last = on[on.length - 1];
    steps.forEach(s => s.classList.toggle('cur', s === last));          // поточний крок «пульсує»
    const tag = $('#lensTag'), t = last ? last.dataset.tag : steps[0].dataset.tag;
    if (tag && tag.textContent !== t) { tag.textContent = t; tag.classList.remove('flip'); void tag.offsetWidth; tag.classList.add('flip'); }
  }
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

/* ---------- гра «Зведи баланс» ---------- */
(() => {
  const root = $('#game'); if (!root) return;
  const OPS = [
    ['Оплата від клієнта за послуги', '24 000 ₴', 'income'], ['Виручка за день', '8 500 ₴', 'income'], ['Передплата за договором', '12 000 ₴', 'income'],
    ['Оплата за виконані роботи', '56 000 ₴', 'income'], ['Повернення переплати від постачальника', '3 200 ₴', 'income'],
    ['Оренда офісу', '18 000 ₴', 'expense'], ['Закупівля товару', '41 500 ₴', 'expense'], ['Реклама в інтернеті', '6 000 ₴', 'expense'],
    ['Зарплата команді', '72 000 ₴', 'expense'], ['Інтернет і зв’язок', '900 ₴', 'expense'],
    ['ЄСВ за працівників', '11 800 ₴', 'tax'], ['ПДВ до бюджету', '19 400 ₴', 'tax'], ['ПДФО із зарплати', '12 960 ₴', 'tax'],
    ['Єдиний податок за квартал', '7 200 ₴', 'tax'], ['Військовий збір', '1 080 ₴', 'tax']
  ];
  const LABEL = { income: 'Надходження', expense: 'Витрати', tax: 'Податки' };
  const lane = $('#lane'), op = $('#op'), screen = $('#gScreen'), btns = [...document.querySelectorAll('#gBtns button')];
  const scoreEl = $('#gScore'), hearts = [...document.querySelectorAll('#gLives i')], live = $('#gLive');
  const FLOOR = 46;
  let queue = [], idx = 0, score = 0, lives = 3, y = 0, speed = 0, state = 'idle', cur = null, last = 0, inView = false, h = 64;

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const paint = () => { scoreEl.textContent = score; hearts.forEach((el, i) => el.classList.toggle('lost', i >= lives)); };
  const setBtns = on => btns.forEach(b => b.disabled = !on);
  const showScreen = html => { screen.innerHTML = html; screen.classList.add('on'); setBtns(false); };

  function intro() {
    state = 'idle'; op.hidden = true;
    showScreen('<h3>Готові зводити баланс?</h3><p>15 операцій, 3 життя. Розкладіть кожну картку на місце, поки вона не впала в «Баланс».</p><div class="row"><button class="btn btn--lg" type="button" data-act="start">Почати</button></div>');
  }
  function start() {
    queue = shuffle(OPS.slice()); idx = 0; score = 0; lives = 3; paint();
    screen.classList.remove('on'); setBtns(true); next();
  }
  function next() {
    if (lives <= 0 || idx >= queue.length) return end();
    const [t, a, c] = queue[idx]; cur = { t, a, c };
    op.className = 'op'; op.querySelector('.op__t').textContent = t; op.querySelector('.op__a').textContent = a; op.hidden = false;
    h = op.offsetHeight || 64;
    speed = 62 + idx * 6;
    y = reduced ? 40 : -h; op.style.transform = `translateY(${y}px)`;
    state = 'play'; last = 0;
  }
  function resolve(ok, wrongNote) {
    state = 'fb';
    if (ok) score++; else lives--;
    op.classList.add(ok ? 'ok' : 'bad');
    if (!ok && wrongNote) op.querySelector('.op__t').textContent = cur.t + ' → ' + LABEL[cur.c];
    live.textContent = ok ? 'Вірно' : 'Невірно: ' + LABEL[cur.c];
    const fig = $('#gFig');                          // Марія реагує: підстрибує на вірну відповідь, хитає головою на помилку
    if (fig) { fig.classList.remove('happy', 'oops'); void fig.offsetWidth; fig.classList.add(ok ? 'happy' : 'oops'); }
    paint(); idx++;
    setTimeout(() => { op.hidden = true; next(); }, ok ? 380 : 1000);
  }
  function answer(c) { if (state === 'play') resolve(c === cur.c, true); }
  function end() {
    state = 'end'; op.hidden = true;
    const win = lives > 0;
    showScreen(`<h3>${win ? 'Баланс зведено!' : 'Баланс не зійшовся'}</h3><p>Ваш рахунок: ${score} з ${OPS.length}. ${win ? 'У реальному обліку таку роботу краще довірити тим, хто робить її щодня.' : 'У реальному обліку помилки коштують дорожче, тому краще мати поруч фахівця.'}</p><div class="row"><a class="btn btn--lg" href="#quiz" data-act="quiz">Підібрати пакет</a><button class="btn btn--ghost btn--lg" type="button" data-act="start">Ще раз</button></div>`);
  }
  function tick(t) {
    if (state === 'play' && inView && !document.hidden && !reduced) {
      const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
      y += speed * dt; op.style.transform = `translateY(${y}px)`;
      if (y + h >= lane.clientHeight - FLOOR) resolve(false, true);
    } else last = 0;
    requestAnimationFrame(tick);
  }
  screen.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act === 'start') start(); });
  btns.forEach(b => b.addEventListener('click', () => answer(b.dataset.c)));
  addEventListener('keydown', e => {
    if (!inView || state !== 'play') return;
    const c = { 1: 'income', 2: 'expense', 3: 'tax' }[e.key]; if (c) answer(c);
  });
  new IntersectionObserver(es => es.forEach(e => inView = e.isIntersecting), { threshold: .3 }).observe(root);
  intro(); requestAnimationFrame(tick);
})();

/* ---------- підбір пакета (квіз) ---------- */
(() => {
  const body = $('#qBody'); if (!body) return;
  const stepEl = $('#qStep'), bar = $('#qBar'), back = $('#qBack');
  const Q = [
    { q: 'Який у вас бізнес?', o: ['ФОП', 'ТОВ', 'Лише планую відкрити'] },
    { q: 'Яка система оподаткування?', o: ['Спрощена (єдиний податок)', 'Загальна, з ПДВ', 'Ще не визначився(лась)'] },
    { q: 'Скільки людей у команді?', o: ['Працюю сам(а)', '2–5 людей', '6–20 людей', 'Понад 20 людей'] },
    { q: 'Що зараз найважливіше?', o: ['Облік і звітність без клопоту', 'Зарплата й кадри', 'Цифри для управління бізнесом', 'Навести лад у процесах і документах'] }
  ];
  let step = 0, ans = [];
  const TG = 'https://t.me/MariiaPanchenko_ua', TEL = 'tel:+380663568040';

  function render() {
    stepEl.textContent = `Питання ${step + 1} з ${Q.length}`;
    bar.style.width = (step / Q.length * 100) + '%';
    back.hidden = step === 0;
    body.innerHTML = `<h3 class="quiz__q">${Q[step].q}</h3><div class="quiz__opts">${Q[step].o.map((t, i) => `<button type="button" style="--i:${i}" data-i="${i}" class="${ans[step] === i ? 'sel' : ''}">${t}</button>`).join('')}</div>`;
  }
  function result() {
    stepEl.textContent = 'Готово'; bar.style.width = '100%'; back.hidden = false;
    const [b, tx, team, goal] = ans, items = [];
    items.push(['Бухгалтерський супровід ФОП', 'Бухгалтерський супровід ТОВ', 'Реєстрація бізнесу та вибір системи оподаткування'][b]);
    items.push(['Податки та звітність на єдиному податку', 'ПДВ і звітність на загальній системі', 'Консультація щодо оптимальної системи оподаткування'][tx]);
    if (team > 0 || goal === 1) items.push('Кадровий облік і зарплата');
    items.push(['Контроль звітності та первинних документів', 'Кадровий облік і зарплата', 'Фінансовий та управлінський облік: P&L, Cash Flow, Balance', 'Аналіз процесів, документообіг і автоматизація'][goal]);
    const list = [...new Set(items)];
    const lc = s => s[0].toLowerCase() + s.slice(1);
    const profile = `${Q[0].o[b]}, ${lc(Q[1].o[tx])}, ${lc(Q[2].o[team])}`;
    const text = `Доброго дня! Пройшов(ла) підбір пакета на сайті Happy Finance. Про мене: ${profile}. Найважливіше: ${lc(Q[3].o[goal])}. Хочу обговорити формат супроводу.`;
    body.innerHTML = `<div class="quiz__res"><h3>Ваш формат супроводу</h3><p class="quiz__sum">${profile}</p><ul class="quiz__list">${list.map((t, i) => `<li style="--i:${i}">${t}</li>`).join('')}</ul><div class="quiz__act"><a class="btn btn--lg" href="${TG}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Написати в Telegram</a><a class="btn btn--ghost btn--lg quiz__tel" href="${TEL}">Зателефонувати</a></div><p class="quiz__note">Склад і вартість уточнимо під ваш запит. Це орієнтовний підбір, не остаточна пропозиція.</p></div>`;
  }
  body.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    ans[step] = +b.dataset.i; body.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
    setTimeout(() => { step++; step < Q.length ? render() : result(); }, 260);
  });
  back.addEventListener('click', () => { if (step >= Q.length) step = Q.length - 1; else step = Math.max(0, step - 1); render(); });
  render();
})();

/* ================= ПРАВКИ РАУНД 2 ================= */

/* ---------- лічильники у плашках першого екрана ---------- */
document.querySelectorAll('[data-count]').forEach(el => {
  const to = +el.dataset.count, suf = el.dataset.suffix || '';
  if (reduced) { el.textContent = to + suf; return; }
  const t0 = performance.now() + 1900;
  (function step(t) {
    const p = Math.max(0, Math.min(1, (t - t0) / 1400));
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
});

/* ---------- переваги: сітка й сяйво за курсором, нахил карток, іконки малюються ---------- */
(() => {
  const sec = $('#advantages'); if (!sec) return;
  const bg = sec.querySelector('.adv__bg');
  sec.querySelectorAll('.card__ico *').forEach(n => n.setAttribute('pathLength', '1'));

  const align = () => {   // лінії сітки продовжують сітку героя
    const G = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--G')) || 110;
    sec.style.setProperty('--goff', (((bg.getBoundingClientRect().top + scrollY) % G) + G) % G + 'px');
  };
  align(); addEventListener('resize', align); document.fonts && document.fonts.ready.then(align);

  const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
  let lastMove = -1e9, inView = false, init = false;
  sec.addEventListener('pointermove', e => {
    const r = bg.getBoundingClientRect(); tgt.x = e.clientX - r.left; tgt.y = e.clientY - r.top; lastMove = performance.now();
  });
  new IntersectionObserver(es => es.forEach(e => inView = e.isIntersecting)).observe(sec);
  const loop = t => {
    if (inView && !document.hidden) {
      const w = bg.clientWidth, h = bg.clientHeight;
      if (t - lastMove > 2500 && !reduced) { tgt.x = w * (.5 + Math.cos(t / 2600) * .38); tgt.y = h * (.5 + Math.sin(t / 1900) * .3); }
      if (!init) { cur.x = tgt.x = w * .5; cur.y = tgt.y = h * .4; init = true; }
      cur.x += (tgt.x - cur.x) * .1; cur.y += (tgt.y - cur.y) * .1;
      bg.style.setProperty('--ax', cur.x + 'px'); bg.style.setProperty('--ay', cur.y + 'px');
    }
    if (!reduced) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  if (matchMedia('(hover: hover)').matches && !reduced) sec.querySelectorAll('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * r.width + 'px'); c.style.setProperty('--my', y * r.height + 'px');
      c.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
})();

/* ---------- вікно «Залишити заявку» ---------- */
(() => {
  const modal = $('#lead'); if (!modal) return;
  const form = $('#leadForm'), err = $('#leadErr'), ok = $('#leadOk');
  let opener = null;
  const svcEl = $('#leadSvc'), tg = modal.querySelector('.modal__tg'), TG = 'https://t.me/MariiaPanchenko_ua';
  const open = el => {
    opener = el; modal.hidden = false; document.body.classList.add('lock');
    form.reset(); err.hidden = true; ok.hidden = true; form.querySelector('.btn').hidden = false;
    const svc = (el && el.dataset.service) || '';   // назва послуги, якщо відкрили з блоку «Послуги»
    svcEl.hidden = !svc; svcEl.textContent = svc ? 'Послуга: ' + svc : '';
    tg.href = svc ? TG + '?text=' + encodeURIComponent('Доброго дня! Цікавить послуга на сайті Happy Finance: ' + svc + '. Хочу обговорити.') : TG;
    setTimeout(() => form.elements.name.focus(), 50);
  };
  const close = () => { modal.hidden = true; document.body.classList.remove('lock'); opener && opener.focus && opener.focus(); };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-open="lead"]'); if (!a) return;
    e.preventDefault(); menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); open(a);
  });
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.name.value.trim(), digits = form.elements.phone.value.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 9) { err.hidden = false; return; }
    err.hidden = true;
    // TODO: підключити відправку (Telegram-бот / CRM). Зараз це демонстрація.
    form.querySelector('.btn').hidden = true; ok.hidden = false;
  });
})();

/* ---------- послуги: легкий паралакс фото ---------- */
(() => {
  const s = $('#services'), img = s && s.querySelector('.svc__bg img'); if (!img || reduced) return;
  const upd = () => { const r = s.getBoundingClientRect(), p = (innerHeight / 2 - (r.top + r.height / 2)) / (innerHeight + r.height); img.style.setProperty('--sp', (p * 70).toFixed(1) + 'px'); };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
})();

/* ---------- заголовки блоків: слова з'являються знизу ---------- */
(() => {
  const heads = document.querySelectorAll('.h2'); if (!heads.length) return;
  let k = 0;
  const wrap = (node, out) => node.childNodes.forEach(n => {
    if (n.nodeType === 3) {
      n.textContent.split(/([ \t\r\n]+)/).forEach(part => {   // \u043d\u0435\u0440\u043e\u0437\u0440\u0438\u0432\u043d\u0438\u0439 \u043f\u0440\u043e\u0431\u0456\u043b \u043b\u0438\u0448\u0430\u0454 \u0441\u043b\u043e\u0432\u0430 \u0432 \u043e\u0434\u043d\u043e\u043c\u0443 \u0431\u043b\u043e\u0446\u0456
        if (!part) return;
        if (/^[ \t\r\n]+$/.test(part)) { out.append(' '); return; }
        const w = document.createElement('span'); w.className = 'hw';
        const i = document.createElement('span'); i.className = 'hw__i'; i.style.setProperty('--i', k++); i.textContent = part;
        w.append(i); out.append(w);
      });
    } else { const c = n.cloneNode(false); wrap(n, c); out.append(c); }
  });
  heads.forEach(h => {
    k = 0; h.setAttribute('aria-label', h.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
    const out = document.createDocumentFragment(); wrap(h, out); h.replaceChildren(out); h.classList.add('hs');
  });
  if (reduced || !('IntersectionObserver' in window)) { heads.forEach(h => h.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .5 });
  heads.forEach(h => io.observe(h));
})();

/* ---------- «розшифрування»: літери слова «ЦИФР» на мить стають цифрами ---------- */
(() => {
  const title = $('#title'), em = $('#title em'); if (!em) return;
  title.setAttribute('aria-label', [...title.querySelectorAll('.ln')].map(l => l.textContent).join(' ').replace(/\s+/g, ' ').trim());
  if (reduced) return;
  const chs = [...em.querySelectorAll('.ch')], orig = chs.map(c => c.textContent), D = '0123456789';
  let busy = false;
  const run = () => {
    if (busy) return; busy = true;
    chs.forEach(c => { c.style.minWidth = c.offsetWidth + 'px'; c.style.textAlign = 'center'; c._n = -1e9; });
    const t0 = performance.now();
    (function step(t) {
      const e = t - t0; let done = true;
      chs.forEach((c, i) => {
        if (e < 650 + i * 170) { done = false; if (e - c._n > 55) { c.textContent = D[Math.random() * 10 | 0]; c._n = e; } }
        else c.textContent = orig[i];
      });
      if (!done) requestAnimationFrame(step);
      else { chs.forEach(c => { c.style.minWidth = ''; c.style.textAlign = ''; }); setTimeout(() => busy = false, 600); }
    })(t0);
  };
  setTimeout(run, 3400);
  em.addEventListener('pointerenter', run);
})();

/* ---------- сітка з підсвіткою під курсором на темних секціях (.gg) ---------- */
(() => {
  const st = [...document.querySelectorAll('.gg')].map((sec, i) => ({ sec, bg: sec.querySelector('.gg__bg'), cur: { x: 0, y: 0 }, tgt: { x: 0, y: 0 }, last: -1e9, inView: false, init: false, ph: i * 1.7, x0: +sec.dataset.x0 || 0 }));
  if (!st.length) return;
  const G = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--G')) || 110;
  const align = () => st.forEach(s => { const top = s.bg.getBoundingClientRect().top + scrollY, g = G(); s.bg.style.setProperty('--goff', (((top % g) + g) % g) + 'px'); });
  align(); addEventListener('resize', align); addEventListener('load', align); document.fonts && document.fonts.ready.then(align);
  st.forEach(s => {
    s.sec.addEventListener('pointermove', e => { const r = s.bg.getBoundingClientRect(); s.tgt.x = e.clientX - r.left; s.tgt.y = e.clientY - r.top; s.last = performance.now(); });
    new IntersectionObserver(es => es.forEach(e => s.inView = e.isIntersecting)).observe(s.sec);
  });
  const loop = t => {
    st.forEach(s => {
      if (!s.inView || document.hidden) return;
      const w = s.bg.clientWidth, h = s.bg.clientHeight;
      if (t - s.last > 2500 && !reduced) { s.tgt.x = w * (s.x0 + (1 - s.x0) * (.5 + Math.cos(t / 2800 + s.ph) * .42)); s.tgt.y = h * (.5 + Math.sin(t / 2100 + s.ph) * .3); }
      if (!s.init) { s.cur.x = s.tgt.x = w * (s.x0 + (1 - s.x0) * .6); s.cur.y = s.tgt.y = h * .4; s.init = true; }
      s.cur.x += (s.tgt.x - s.cur.x) * .1; s.cur.y += (s.tgt.y - s.cur.y) * .1;
      s.bg.style.setProperty('--ax', s.cur.x + 'px'); s.bg.style.setProperty('--ay', s.cur.y + 'px');
    });
    if (!reduced) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ---------- «ясності немає»: шум стає чітким словом ---------- */
(() => {
  const h = $('.pain .h2'); if (!h || reduced) return;
  const words = [...h.querySelectorAll('em .hw__i')]; if (!words.length) return;
  const orig = words.map(w => w.textContent), POOL = 'асеноптрик';   // вузькі літери схожої ширини
  let busy = false;
  const run = () => {
    if (busy) return; busy = true;
    // ширина слів жорстко фіксується: що б не показувалось, слово не може перенестись на наступний рядок
    words.forEach(w => { const b = w.getBoundingClientRect().width; w.style.width = b + 'px'; w.style.minWidth = b + 'px'; w.style.maxWidth = b + 'px'; w.style.whiteSpace = 'nowrap'; w.style.overflow = 'hidden'; w.style.verticalAlign = 'top'; });
    const DUR = 950, t0 = performance.now(); let last = -1e9;
    (function step(t) {
      const e = t - t0;
      if (e < DUR) {
        if (t - last > 70) {                       // кожні ~70 мс міняємо лише 1–3 літери в слові; з часом їх стає менше
          last = t; const n = e < DUR * .45 ? 3 : e < DUR * .75 ? 2 : 1;
          words.forEach((w, wi) => {
            const chars = [...orig[wi]];
            for (let k = 0; k < n; k++) { const i = Math.random() * chars.length | 0; chars[i] = POOL[Math.random() * POOL.length | 0]; }
            w.textContent = chars.join('');
          });
        }
        requestAnimationFrame(step);
      } else {
        words.forEach((w, i) => { w.textContent = orig[i]; w.style.width = w.style.minWidth = w.style.maxWidth = w.style.whiteSpace = w.style.overflow = w.style.verticalAlign = ''; });
        setTimeout(() => busy = false, 500);
      }
    })(t0);
  };
  new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); setTimeout(run, 1100); } }), { threshold: .6 }).observe(h);
  h.querySelector('em').addEventListener('pointerenter', run);
})();

/* ---------- кнопки: різний початок блику, щоб не блимали одночасно ---------- */
document.querySelectorAll('.btn:not(.btn--ghost):not(.btn--sm)').forEach(b => b.style.setProperty('--bd', (2.5 + Math.random() * 5).toFixed(1) + 's'));

/* ---------- цифри 01 · 02 · 03: коротке «розшифрування» перед заливкою ---------- */
(() => {
  const lis = [...document.querySelectorAll('.flow3 li')]; if (!lis.length || reduced) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const n = e.target.querySelector('.f3n'), fin = n.textContent, idx = lis.indexOf(e.target);
    setTimeout(() => { const t0 = performance.now(), D = () => '' + (Math.random() * 10 | 0) + (Math.random() * 10 | 0); let l = -1e9;
      (function s(t) { if (t - t0 < 560) { if (t - l > 55) { n.textContent = D(); l = t; } requestAnimationFrame(s); } else n.textContent = fin; })(t0); }, 900 + idx * 260);
  }), { threshold: .7 });
  lis.forEach(li => io.observe(li));
})();

/* ================= ЗАВЕРШАЛЬНІ БЛОКИ ================= */

/* ---------- Марія: лічильники ×4 та ~300 ---------- */
(() => {
  const els = [...document.querySelectorAll('[data-to]')]; if (!els.length) return;
  const run = el => {
    const to = +el.dataset.to, pre = el.dataset.prefix || '';
    if (reduced) { el.textContent = pre + to; return; }
    const t0 = performance.now();
    (function s(t) { const p = Math.min(1, (t - t0) / 1500); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => run(e.target), 250); } }), { threshold: .6 });
  els.forEach(e => io.observe(e));
})();

/* ---------- FAQ: акордеон ---------- */
(() => {
  const list = $('#faqList'); if (!list) return;
  list.addEventListener('click', e => {
    const b = e.target.closest('.qa__q'); if (!b) return;
    const qa = b.parentElement, open = !qa.classList.contains('open');
    list.querySelectorAll('.qa.open').forEach(o => { if (o !== qa) { o.classList.remove('open'); o.querySelector('.qa__q').setAttribute('aria-expanded', false); } });
    qa.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
  });
})();

/* ---------- Форма в кінці сторінки (демо: нікуди не надсилається) ---------- */
(() => {
  const f = $('#ctaForm'); if (!f) return;
  const err = $('#ctaErr'), ok = $('#ctaOk');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = f.elements.name.value.trim(), digits = f.elements.phone.value.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 9) { err.hidden = false; return; }
    err.hidden = true;
    // TODO: підключити відправку (Telegram-бот / CRM). Зараз це демонстрація.
    f.querySelector('.btn').hidden = true; ok.hidden = false;
  });
})();

/* ---------- Політика конфіденційності (заглушка) ---------- */
(() => {
  const m = $('#privacy'); if (!m) return;
  const close = () => { m.hidden = true; document.body.classList.remove('lock'); };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-open="privacy"]');
    if (a) { e.preventDefault(); m.hidden = false; document.body.classList.add('lock'); }
    else if (!m.hidden && e.target.closest('#privacy [data-close]')) close();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) close(); });
})();

/* ---------- «Команда»: 3D-нахил, паралакс і колір під курсором ---------- */
(() => {
  if (reduced || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.tcard').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--rx', ((.5 - y) * 11).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - .5) * 13).toFixed(2) + 'deg');
      c.style.setProperty('--px', (x - .5).toFixed(3)); c.style.setProperty('--py', (y - .5).toFixed(3));
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--px', '0'); c.style.setProperty('--py', '0'); });
  });
})();

/* ---------- «Команда»: розгортання картки у висувну панель ---------- */
(() => {
  const dr = $('#drawer'); if (!dr) return;
  // TODO клієнтка: підтвердити тексти з кожною людиною. Лише професійні факти з наданих документів.
  const TEAM = [
    { n: 'Євгенія Мазепа', role: 'Головний бухгалтер', img: 'img/team-evgenia.jpg',
      lead: 'Веде бухгалтерію від первинних документів до звітності й знає бізнес з боку фінансового директора.',
      path: [
        ['Автомагазин', 'Менеджер і первинна бухгалтерія, допомога в розмитненні вантажів.'],
        ['Комісійна торгівля', 'Первинні документи, робота з касовим апаратом, податкова й статистична звітність.'],
        ['Будівництво', 'Повна первинна бухгалтерія, облік і списання матеріалів на об’єктах, звірки з податковою. Паралельно вела ТОВ на загальній системі, ТОВ на єдиному податку та кілька ФОП.'],
        ['Продаж підлогових покриттів', 'Фінансовий директор: облік від А до Я, звітність, взаємодія з контролюючими органами, управлінський облік.'],
        ['Фінансовий менеджер', 'Керувала грошовими потоками в нішевій сфері.']
      ],
      tags: ['Первинні документи', 'Податкова звітність', 'ТОВ і ФОП', 'Звірки з податковою', 'Управлінський облік'] },
    { n: 'Карина Омельченко', role: 'Первинні документи, ПРРО', img: 'img/team-karyna.jpg',
      lead: 'Відповідає за щоденні операції: первинні документи та роботу з ПРРО, щоб в обліку не було прогалин.',
      path: [
        ['Роздрібна торгівля', 'Продавець, потім адміністратор.'],
        ['Агросектор', 'Бухгалтер у компанії аграрного напряму.'],
        ['Happy Finance', 'Первинні документи та ПРРО.']
      ],
      tags: ['Первинні документи', 'ПРРО', 'Щоденні операції', 'Роздрібна торгівля'] },
    { n: 'Юлія Авер’янова', role: 'Зарплата', ini: 'ЮА',
      lead: 'Понад 20 років у бухгалтерії. Відповідає за нарахування зарплати та кадрові розрахунки.',
      path: [
        ['Початок шляху', 'Касир, потім головний бухгалтер на невеликому підприємстві.'],
        ['Різні компанії', 'Бухгалтер і бухгалтер-операціоніст.'],
        ['Понад 15 років в одній компанії', 'Бухгалтер із дипломом спеціаліста.']
      ],
      tags: ['Зарплата', 'Кадрові розрахунки', 'Понад 20 років досвіду'] },
    { n: 'Надія Гончаренко', role: 'Закупівлі, первинні документи', ini: 'НГ',
      lead: 'Керувала відділом обліку первинних документів і закупівлями. Знає, як будуються процеси.',
      path: [
        ['Роздрібна мережа', 'Менеджер із закупівель: асортимент, ціноутворення, акції, переговори з постачальниками, документообіг.'],
        ['Аудиторська компанія', 'Бухгалтерія кількох підприємств, первинні документи, акти звірок, підготовка до податкових перевірок.'],
        ['Відділ обліку первинних документів', 'Спеціаліст, потім керівник відділу: 13 людей у трьох філіях, табелі, нарахування зарплати, контроль завдань.'],
        ['Закупівлі та дебіторка', 'Постачання складу, інвентаризації, переговори, звірки з контрагентами.']
      ],
      tags: ['Первинні документи', 'Закупівлі', 'Керівництво командою', 'Підготовка до перевірок'] }
  ];
  const cards = [...document.querySelectorAll('.tcard')];
  const el = { top: $('#drTop'), body: $('#drBody'), tag: $('#drTag'), name: $('#drName'), role: $('#drRole'), lead: $('#drLead'), path: $('#drPath'), tags: $('#drTags') };
  let cur = 0, opener = null, closing = 0;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function render(i, animate) {
    cur = (i + TEAM.length) % TEAM.length; const m = TEAM[cur];
    el.top.innerHTML = m.img ? `<img src="${m.img}" alt="">` : `<span class="drawer__ini" aria-hidden="true">${m.ini}</span>`;
    el.tag.textContent = `Команда · ${String(cur + 1).padStart(2, '0')} / ${String(TEAM.length).padStart(2, '0')}`;
    el.name.textContent = m.n; el.role.textContent = m.role; el.lead.textContent = m.lead;
    el.path.innerHTML = m.path.map((p, k) => `<li style="--i:${k}"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></li>`).join('');
    el.tags.innerHTML = m.tags.map(t => `<li>${esc(t)}</li>`).join('');
    el.body.scrollTop = 0;
    if (animate) { el.body.classList.remove('swap'); void el.body.offsetWidth; el.body.classList.add('swap'); }
  }
  function show(i, from) {
    clearTimeout(closing); opener = from || null; render(i, true);
    dr.hidden = false; document.body.classList.add('lock');
    void dr.offsetWidth; dr.classList.add("on");
    setTimeout(() => dr.querySelector('.drawer__x').focus(), 120);
  }
  function close() {
    if (dr.hidden) return;
    dr.classList.remove('on'); document.body.classList.remove('lock');
    closing = setTimeout(() => { dr.hidden = true; }, 520);
    opener && opener.focus && opener.focus();
  }
  cards.forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tcard__more'; b.innerHTML = 'Докладніше <i aria-hidden="true">→</i>';
    b.setAttribute('aria-label', 'Докладніше про ' + TEAM[i].n); c.append(b);
    b.addEventListener('click', e => { e.stopPropagation(); show(i, b); });
    c.addEventListener('click', e => { if (!e.target.closest('button, a')) show(i, b); });
  });
  dr.addEventListener('click', e => {
    if (e.target.closest('[data-dclose]')) close();
    else if (e.target.closest('.drawer__foot .btn')) close();      // заявку відкриє вікно «Залишити заявку»
  });
  $('#drPrev').addEventListener('click', () => render(cur - 1, true));
  $('#drNext').addEventListener('click', () => render(cur + 1, true));
  addEventListener('keydown', e => {
    if (dr.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') render(cur - 1, true);
    else if (e.key === 'ArrowRight') render(cur + 1, true);
  });
})();

/* ---------- FAQ: ширина Марії від ліктя до ліктя = ширина найдовшого рядка заголовка ---------- */
(() => {
  const fig = $('.faq__fig'), h2 = $('.faq__head .h2'); if (!fig || !h2) return;
  const fit = () => {
    const words = [...h2.querySelectorAll('.hw')]; if (!words.length) return;
    const lines = {};
    words.forEach(w => { const k = w.offsetTop; (lines[k] = lines[k] || []).push(w); });
    let max = 0;
    Object.values(lines).forEach(l => { const a = l[0], b = l[l.length - 1]; max = Math.max(max, b.offsetLeft + b.offsetWidth - a.offsetLeft); });
    if (max > 80) fig.style.width = Math.min(max, h2.offsetWidth) + 'px';
  };
  fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit); addEventListener('load', fit);
})();

/* ---------- Квіз: блокнот розкривається при появі ---------- */
(() => {
  const c = document.getElementById('quizCard'); if (!c) return;
  if (!('IntersectionObserver' in window)) { c.classList.add('open'); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { c.classList.add('open'); io.disconnect(); } }, { threshold: .3 });
  io.observe(c.parentElement);
})();
(() => {
  const c = document.getElementById('quizCard'); if (!c) return;
  const chk = () => { const r = c.parentElement.getBoundingClientRect(); if (r.top < innerHeight * .7 && r.bottom > innerHeight * .2) { c.classList.add('open'); removeEventListener('scroll', chk); } };
  addEventListener('scroll', chk, { passive: true }); chk();
})();
/* ---------- Кнопки швидкого зв'язку: з'являються після першого екрана ---------- */
(() => {
  const f = document.getElementById('fab'), hero = document.getElementById('hero'); if (!f || !hero) return;
  const chk = () => f.classList.toggle('on', hero.getBoundingClientRect().bottom < innerHeight * .4);
  addEventListener('scroll', chk, { passive: true }); addEventListener('resize', chk); chk();
})();