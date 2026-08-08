/* ══════════════════════════════════════════════════
   Feliz cumpleaños Marianita — lógica del juego
   ══════════════════════════════════════════════════ */

/* Pon aquí tu número de WhatsApp con código de país, solo dígitos.
   Ejemplo Venezuela: 584121234567 */
const WHATSAPP_NUMERO = '584123457832';

const NOMBRE = 'Marianita';

/* ── El paseo: preguntas y mensajitos de amor ───────
   tipo 'pregunta' guarda la respuesta; tipo 'mensaje'
   solo le dice cosas lindas y sigue el camino. */
const PASOS = [
  {
    tipo: 'pregunta',
    icono: '🌅',
    parada: 'El desayuno',
    texto: '¿Qué te gustaría desayunar?',
    burbuja: 'Anotado, mi amor 📝',
    opciones: [
      { emo: '🥟', texto: 'Empanada' },
      { emo: '🫓', texto: 'Arepa' },
      { emo: '🥧', texto: 'Pastelito' }
    ]
  },
  {
    tipo: 'mensaje',
    icono: '💗',
    parada: 'Para ti',
    texto: 'Antes de seguir...',
    burbuja: 'Te amo tanto 💗',
    parrafos: [
      'Quiero que sepas que eres lo más bonito que me ha pasado. Me encanta tu sonrisa, tu manera de mirarme y cómo haces que un día cualquiera se sienta especial.',
      'Hoy cumples años tú, pero el que salió ganando fui yo.'
    ],
    boton: 'Seguir el paseo 💕'
  },
  {
    tipo: 'pregunta',
    icono: '🍽️',
    parada: 'El almuerzo',
    texto: '¿Qué quieres comer de almuerzo?',
    burbuja: 'Me encanta tu elección 💕',
    opciones: [
      { emo: '🍤', texto: 'Coquere' },
      { emo: '🍝', texto: 'Emilia Romagna' }
    ]
  },
  {
    tipo: 'mensaje',
    icono: '✨',
    parada: 'Sigue el día',
    texto: 'Sigue pasándola bonito',
    burbuja: 'Falta lo mejor ✨',
    parrafos: [
      'Quiero que hoy te rías mucho, que comas rico, que te consientan y que no te preocupes por nada. Te lo mereces todo, mi amor.',
      'Todavía queda día por delante, así que sigue disfrutando: lo mejor viene ahorita.'
    ],
    boton: 'Vamos, sigo 🎉'
  },
  {
    tipo: 'pregunta',
    icono: '🌙',
    parada: 'La cena',
    texto: '¿Y qué te gustaría cenar?',
    burbuja: 'Contigo a donde sea 🥺',
    opciones: [
      { emo: '🍕', texto: 'Pizza' },
      { emo: '🫓', texto: 'Arepa' },
      { emo: '🍣', texto: 'Sushi' },
      { emo: '✍️', texto: 'Otra cosa (yo la escribo)', libre: true }
    ]
  }
];

/* ── Paradas del mapa (una por paso + la meta) ── */
const PUNTOS = [
  { x: 11, y: 92 },
  { x: 36, y: 84 },
  { x: 66, y: 90 },
  { x: 86, y: 74 },
  { x: 50, y: 66 },
  { x: 22, y: 54 }
];

/* ══════════════════════════════════════════════════
   Estado
   ══════════════════════════════════════════════════ */
let indicePaso = 0;
let respuestas = [];
let largoEn = [];
let caminando = false;

/* ══════════════════════════════════════════════════
   Utilidades
   ══════════════════════════════════════════════════ */
const $ = (sel) => document.querySelector(sel);
const SVG_NS = 'http://www.w3.org/2000/svg';

function nuevaNina(clases) {
  const nina = $('#tpl-nina').content.firstElementChild.cloneNode(true);
  if (clases) nina.className += ' ' + clases;
  return nina;
}

function mostrarPantalla(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
}

/* ══════════════════════════════════════════════════
   Decoración: globos de la intro y skyline del mapa
   ══════════════════════════════════════════════════ */
function pintarGlobos() {
  const cont = $('#deco-globos');
  const colores = ['#ff5fa8', '#ffd166', '#8ce0ff', '#c792ff', '#ff8a6b', '#8affc1'];
  for (let i = 0; i < 11; i++) {
    const g = document.createElement('div');
    g.className = 'globo';
    g.style.left = 4 + Math.random() * 90 + '%';
    g.style.background = colores[i % colores.length];
    g.style.animationDuration = 11 + Math.random() * 9 + 's';
    g.style.animationDelay = -Math.random() * 14 + 's';
    g.style.transform = `scale(${0.7 + Math.random() * 0.7})`;
    cont.appendChild(g);
  }
  ['💗', '✨', '🎈', '💖', '🎉', '✨'].forEach((emo, i) => {
    const c = document.createElement('span');
    c.className = 'chispa';
    c.textContent = emo;
    c.style.left = 8 + Math.random() * 84 + '%';
    c.style.animationDuration = 13 + Math.random() * 8 + 's';
    c.style.animationDelay = -i * 2.4 + 's';
    cont.appendChild(c);
  });
}

function pintarSkyline() {
  const cont = $('#mapa-skyline');
  const total = 16;
  for (let i = 0; i < total; i++) {
    const e = document.createElement('div');
    e.className = 'edificio';
    if (i === Math.floor(total / 2)) {
      e.classList.add('iglesia');
      e.style.height = '82%';
    } else {
      e.style.height = 34 + Math.random() * 55 + '%';
      e.style.width = 8 + Math.random() * 8 + 'px';
    }
    cont.appendChild(e);
  }
}

/* ══════════════════════════════════════════════════
   Mapa: camino suave y paradas
   ══════════════════════════════════════════════════ */

/* Convierte los puntos en segmentos cúbicos suaves (Catmull-Rom → Bézier) */
function segmentosCubicos(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    segs.push({
      c1x: p1.x + (p2.x - p0.x) / 6,
      c1y: p1.y + (p2.y - p0.y) / 6,
      c2x: p2.x - (p3.x - p1.x) / 6,
      c2y: p2.y - (p3.y - p1.y) / 6,
      x: p2.x,
      y: p2.y,
      desdeX: p1.x,
      desdeY: p1.y
    });
  }
  return segs;
}

function construirMapa() {
  const svg = $('.mapa-camino');
  const base = $('#camino-base');
  const hecho = $('#camino-hecho');
  const segs = segmentosCubicos(PUNTOS);

  let d = `M ${PUNTOS[0].x} ${PUNTOS[0].y}`;
  segs.forEach((s) => {
    d += ` C ${s.c1x} ${s.c1y}, ${s.c2x} ${s.c2y}, ${s.x} ${s.y}`;
  });
  base.setAttribute('d', d);
  hecho.setAttribute('d', `M ${PUNTOS[0].x} ${PUNTOS[0].y}`);

  // Longitud acumulada hasta cada parada, midiendo segmento por segmento
  const medidor = document.createElementNS(SVG_NS, 'path');
  svg.appendChild(medidor);
  largoEn = [0];
  segs.forEach((s, i) => {
    medidor.setAttribute(
      'd',
      `M ${s.desdeX} ${s.desdeY} C ${s.c1x} ${s.c1y}, ${s.c2x} ${s.c2y}, ${s.x} ${s.y}`
    );
    largoEn.push(largoEn[i] + medidor.getTotalLength());
  });
  svg.removeChild(medidor);

  pintarParadas();
  colocarNina(0);
}

function pintarParadas() {
  const cont = $('#paradas');
  cont.innerHTML = '';
  PUNTOS.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'parada';
    div.dataset.indice = i;
    div.style.left = p.x + '%';
    div.style.top = p.y + '%';
    if (p.x < 20) div.classList.add('borde-izq');
    if (p.x > 78) div.classList.add('borde-der');

    const esMeta = i === PUNTOS.length - 1;
    div.textContent = esMeta ? '💖' : PASOS[i].icono;

    const et = document.createElement('span');
    et.className = 'etiqueta';
    et.textContent = esMeta ? 'Te amo' : PASOS[i].parada;
    div.appendChild(et);

    cont.appendChild(div);
  });
  marcarParadas();
}

function marcarParadas() {
  document.querySelectorAll('.parada').forEach((p) => {
    const i = Number(p.dataset.indice);
    p.classList.toggle('hecha', i < indicePaso);
    p.classList.toggle('actual', i === indicePaso);
  });
}

function puntoEn(largo) {
  const p = $('#camino-base').getPointAtLength(largo);
  return { x: p.x, y: p.y };
}

/* Redibuja el tramo ya recorrido. Se hace punto por punto (y no con
   stroke-dasharray) porque el mapa se estira y los guiones no coincidirían
   con el largo real del camino en pantalla. */
function pintarCaminoHecho(largo) {
  const hecho = $('#camino-hecho');
  const pasos = Math.max(1, Math.ceil(largo / 1.2));
  let d = `M ${PUNTOS[0].x} ${PUNTOS[0].y}`;
  for (let i = 1; i <= pasos; i++) {
    const p = puntoEn((largo * i) / pasos);
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  hecho.setAttribute('d', d);
}

function colocarNina(largo) {
  const peona = $('#peona');
  const p = puntoEn(largo);
  peona.style.left = p.x + '%';
  peona.style.top = p.y + '%';
  pintarCaminoHecho(largo);
}

function caminarHasta(indice) {
  return new Promise((resolve) => {
    const desde = largoEn[indicePaso];
    const hasta = largoEn[indice];
    const peona = $('#peona');
    const nina = peona.querySelector('.nina');
    const duracion = 1200;
    const inicio = performance.now();

    // Mirar hacia donde camina
    const pa = puntoEn(desde);
    const pb = puntoEn(hasta);
    nina.style.setProperty('--flip', pb.x < pa.x ? -1 : 1);

    caminando = true;
    peona.classList.add('caminando');
    nina.classList.add('caminando');

    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      colocarNina(desde + (hasta - desde) * suave);
      if (t < 1) {
        requestAnimationFrame(paso);
      } else {
        peona.classList.remove('caminando');
        nina.classList.remove('caminando');
        caminando = false;
        resolve();
      }
    }
    requestAnimationFrame(paso);
  });
}

function burbuja(texto) {
  let b = $('#mapa .burbuja');
  if (!b) {
    b = document.createElement('div');
    b.className = 'burbuja';
    $('#mapa').appendChild(b);
  }
  b.textContent = texto;
  requestAnimationFrame(() => b.classList.add('show'));
  clearTimeout(burbuja.reloj);
  burbuja.reloj = setTimeout(() => b.classList.remove('show'), 2200);
}

/* ══════════════════════════════════════════════════
   Pasos del paseo
   ══════════════════════════════════════════════════ */
const TOTAL_PREGUNTAS = PASOS.filter((p) => p.tipo === 'pregunta').length;

function numeroDePregunta(indice) {
  return PASOS.slice(0, indice + 1).filter((p) => p.tipo === 'pregunta').length;
}

function pintarPaso() {
  const paso = PASOS[indicePaso];
  const cont = $('#opciones');

  $('#pregunta-texto').textContent = paso.texto;
  $('#paso-actual').textContent = indicePaso + 1;
  $('#barra-fill').style.width = (indicePaso / PASOS.length) * 100 + '%';
  cont.innerHTML = '';

  if (paso.tipo === 'mensaje') {
    $('#pregunta-num').textContent = 'Un momentito para ti';
    cont.className = 'opciones mensaje';

    paso.parrafos.forEach((texto) => {
      const p = document.createElement('p');
      p.className = 'mensaje-texto';
      p.textContent = texto;
      cont.appendChild(p);
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-main';
    btn.textContent = paso.boton;
    btn.addEventListener('click', () => avanzar(btn));
    cont.appendChild(btn);
  } else {
    $('#pregunta-num').textContent =
      `Pregunta ${numeroDePregunta(indicePaso)} de ${TOTAL_PREGUNTAS}`;
    cont.className = 'opciones';

    paso.opciones.forEach((op) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'opcion';
      btn.innerHTML = `<span class="emo">${op.emo}</span><span>${op.texto}</span>`;
      btn.addEventListener('click', () => responder(btn, op));
      cont.appendChild(btn);
    });
  }

  marcarParadas();
}

function guardarRespuesta(texto, emo) {
  respuestas.push({ pregunta: PASOS[indicePaso].texto, respuesta: texto, emo });
}

function responder(btn, opcion) {
  if (caminando) return;

  const cont = $('#opciones');
  cont.querySelectorAll('.opcion').forEach((b) => b.classList.remove('elegida'));
  const cajaVieja = cont.querySelector('.libre-caja');
  if (cajaVieja) cajaVieja.remove();
  btn.classList.add('elegida');

  // Si eligió "otra cosa", primero nos dice qué se le antoja
  if (opcion.libre) {
    pedirTexto(btn, opcion);
    return;
  }

  guardarRespuesta(opcion.texto, opcion.emo);
  avanzar(btn);
}

function pedirTexto(btn, opcion) {
  const caja = document.createElement('div');
  caja.className = 'libre-caja';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'libre-input';
  input.placeholder = 'Escribe qué se te antoja...';
  input.maxLength = 60;
  input.setAttribute('aria-label', 'Escribe qué se te antoja de cena');

  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'btn-sec libre-ok';
  ok.textContent = 'Listo 💗';

  function enviar() {
    const texto = input.value.trim();
    if (!texto) {
      caja.classList.add('falta');
      input.focus();
      return;
    }
    guardarRespuesta(texto, opcion.emo);
    avanzar(ok);
  }

  ok.addEventListener('click', enviar);
  input.addEventListener('input', () => caja.classList.remove('falta'));
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      enviar();
    }
  });

  caja.append(input, ok);
  btn.after(caja);
  input.focus();
}

async function avanzar(btn) {
  if (caminando) return;
  btn.disabled = true;
  $('#opciones').classList.add('bloqueado');
  burbuja(PASOS[indicePaso].burbuja);

  const siguiente = indicePaso + 1;
  $('#barra-fill').style.width = (siguiente / PASOS.length) * 100 + '%';
  await caminarHasta(siguiente);

  indicePaso = siguiente;
  marcarParadas();

  if (indicePaso >= PASOS.length) {
    terminar();
  } else {
    pintarPaso();
  }
}

/* ══════════════════════════════════════════════════
   Final
   ══════════════════════════════════════════════════ */
function textoMensaje() {
  const extra = $('#extra').value.trim();
  let msg = `💌 Respuestas de ${NOMBRE} 🎂\n\n`;
  respuestas.forEach((r, i) => {
    msg += `${i + 1}. ${r.pregunta}\n   👉 ${r.respuesta}\n`;
  });
  if (extra) msg += `\n💬 Además quiero decirte:\n${extra}\n`;
  msg += '\nTe amo 💗';
  return msg;
}

function numeroValido() {
  return /^\d{8,15}$/.test(WHATSAPP_NUMERO);
}

function actualizarEnlaceWA() {
  const a = $('#btn-wa');
  a.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoMensaje())}`;
}

function terminar() {
  actualizarEnlaceWA();
  // El botón de copiar solo aparece como respaldo si falta configurar el número
  $('#btn-copiar').classList.toggle('oculto', numeroValido());
  mostrarPantalla('#screen-end');
  arrancarConfeti();
}

async function copiarRespuestas() {
  const texto = textoMensaje();
  try {
    await navigator.clipboard.writeText(texto);
    aviso('¡Copiado! Ya puedes pegarlo donde quieras 💗');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    aviso(ok ? '¡Copiado! 💗' : 'No pude copiar, selecciona el texto de arriba.');
  }
}

function aviso(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  clearTimeout(aviso.reloj);
  aviso.reloj = setTimeout(() => (el.textContent = ''), 4000);
}

/* ══════════════════════════════════════════════════
   Confeti
   ══════════════════════════════════════════════════ */
let confetiActivo = false;

function arrancarConfeti() {
  if (confetiActivo) return;
  const canvas = $('#confetti-canvas');
  const ctx = canvas.getContext('2d');
  const colores = ['#ff5fa8', '#ffd166', '#8ce0ff', '#c792ff', '#8affc1', '#fff'];
  const particulas = [];
  let ancho = 0;
  let alto = 0;

  function medir() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    ancho = r.width;
    alto = r.height;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  window.addEventListener('resize', medir);

  function crear(y) {
    return {
      x: Math.random() * ancho,
      y: y !== undefined ? y : -20,
      vy: 0.7 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.9,
      giro: Math.random() * Math.PI * 2,
      vgiro: (Math.random() - 0.5) * 0.09,
      tam: 6 + Math.random() * 8,
      color: colores[Math.floor(Math.random() * colores.length)],
      corazon: Math.random() < 0.32
    };
  }

  for (let i = 0; i < 80; i++) {
    particulas.push(crear(Math.random() * alto));
  }

  function corazon(ctx, x, y, t) {
    ctx.beginPath();
    ctx.moveTo(x, y + t * 0.35);
    ctx.bezierCurveTo(x, y, x - t / 2, y, x - t / 2, y + t * 0.3);
    ctx.bezierCurveTo(x - t / 2, y + t * 0.62, x, y + t * 0.82, x, y + t);
    ctx.bezierCurveTo(x, y + t * 0.82, x + t / 2, y + t * 0.62, x + t / 2, y + t * 0.3);
    ctx.bezierCurveTo(x + t / 2, y, x, y, x, y + t * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  confetiActivo = true;

  (function animar() {
    if (!$('#screen-end').classList.contains('active')) {
      confetiActivo = false;
      window.removeEventListener('resize', medir);
      ctx.clearRect(0, 0, ancho, alto);
      return;
    }
    ctx.clearRect(0, 0, ancho, alto);
    particulas.forEach((p, i) => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y / 42) * 0.5;
      p.giro += p.vgiro;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.9;
      if (p.corazon) {
        corazon(ctx, 0, -p.tam / 2, p.tam);
      } else {
        ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2);
      }
      ctx.restore();
      if (p.y > alto + 30) particulas[i] = crear();
    });
    requestAnimationFrame(animar);
  })();
}

/* ══════════════════════════════════════════════════
   Arranque
   ══════════════════════════════════════════════════ */
function reiniciar() {
  indicePaso = 0;
  respuestas = [];
  $('#extra').value = '';
  $('#aviso').textContent = '';
  $('#barra-fill').style.width = '0%';
  colocarNina(0);
  pintarPaso();
  mostrarPantalla('#screen-intro');
}

function iniciar() {
  pintarGlobos();
  pintarSkyline();

  $('#intro-nina').appendChild(nuevaNina('saludando contenta'));
  $('#end-nina').appendChild(nuevaNina('saludando contenta'));
  $('#peona').appendChild(nuevaNina());

  $('#paso-total').textContent = PASOS.length;
  construirMapa();
  pintarPaso();

  $('#btn-play').addEventListener('click', () => {
    mostrarPantalla('#screen-game');
    // Se vuelve a medir con el mapa ya visible, por si el navegador
    // no calculó el largo del camino mientras estaba oculto
    requestAnimationFrame(() => {
      construirMapa();
      colocarNina(largoEn[indicePaso]);
    });
  });

  $('#btn-copiar').addEventListener('click', copiarRespuestas);
  $('#extra').addEventListener('input', actualizarEnlaceWA);
  $('#btn-replay').addEventListener('click', reiniciar);

  $('#btn-wa').addEventListener('click', (ev) => {
    if (!numeroValido()) {
      ev.preventDefault();
      aviso('Falta poner el número de WhatsApp en game.js. Usa "Copiar respuestas" 💗');
      return;
    }
    actualizarEnlaceWA();
  });
}

document.addEventListener('DOMContentLoaded', iniciar);
