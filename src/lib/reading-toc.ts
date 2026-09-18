/** A desktop reading rail with a spring at the current reading position. */
export function initReadingToc(root: HTMLElement) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
  const headings = links.map((link) => document.getElementById(link.dataset.tocLink!));
  const prose = document.querySelector<HTMLElement>('.article-content .prose');
  if (!prose || !links.length || headings.some((heading) => !heading)) return;

  const desktop = matchMedia('(min-width: 981px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = root.querySelector<HTMLElement>('.toc-rail')!;
  const svg = root.querySelector<SVGSVGElement>('.toc-thread')!;
  const track = root.querySelector<SVGPathElement>('.toc-thread-track')!;
  const accent = root.querySelector<SVGPathElement>('.toc-thread-progress')!;
  const nodes = [...root.querySelectorAll<SVGCircleElement>('.toc-thread-node')];
  const label = root.querySelector<HTMLElement>('.toc-reading-label')!;
  const title = root.querySelector<HTMLElement>('[data-reading-title]')!;
  const percentage = root.querySelector<HTMLElement>('[data-reading-progress]')!;
  const expandedPercentage = root.querySelector<HTMLElement>('[data-toc-progress]')!;
  const outline = root.querySelector<HTMLElement>('.toc-outline')!;
  const activeMark = root.querySelector<HTMLElement>('.toc-active-mark')!;
  const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const railX = 12;
  const restingBend = 8;
  const bendRadius = 28;
  const segmentLength = 16;
  const labelGap = 20;

  let offsets: number[] = [];
  let nodePositions: number[] = [];
  let start = 0;
  let end = 1;
  let readingOffset = 100;
  let height = 1;
  let labelHeight = 48;
  let target = 0;
  let position = 0;
  let velocity = 0;
  let bend = 0;
  let bendVelocity = 0;
  let bendTarget = 0;
  let lastScroll = window.scrollY;
  let lastTime = 0;
  let frame = 0;
  let measureFrame = 0;
  let active = -1;
  let atEndpoint = true;
  let pointer: { x: number; y: number } | undefined;
  let keyboardNavigation = true;

  function placeActiveMark() {
    if (active < 0) return;
    const bounds = links[active].getBoundingClientRect();
    activeMark.style.translate = `0 ${bounds.top - outline.getBoundingClientRect().top}px`;
    activeMark.style.height = `${bounds.height}px`;
  }

  function updateMode() {
    if (!desktop.matches) return;
    // Hit-test again on scroll: the body can move underneath a stationary pointer.
    const overBody = pointer && prose!.contains(document.elementFromPoint(pointer.x, pointer.y));
    const keyboardFocus = keyboardNavigation && root.contains(document.activeElement);
    const open = String(!overBody || atEndpoint || keyboardFocus);
    if (root.dataset.tocOpen === open) return;
    root.dataset.tocOpen = open;
    if (open === 'true') placeActiveMark();
  }

  function readPosition() {
    const scroll = window.scrollY;
    const progress = end > start ? clamp((scroll - start) / (end - start)) : Number(scroll >= Math.max(0, end));
    target = progress * height;
    const atPageEnd = scroll >= document.documentElement.scrollHeight - innerHeight - 1;
    const index = atPageEnd ? links.length - 1 : Math.max(0, offsets.findLastIndex((top) => top <= scroll + readingOffset + 1));
    if (active !== index) {
      active = index;
      links.forEach((link, i) => {
        if (i === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
        nodes[i].toggleAttribute('data-current', i === active);
      });
      title.textContent = headings[active]!.textContent;
      labelHeight = label.offsetHeight;
      placeActiveMark();
    }
    const percent = Math.round(progress * 100);
    const text = `${percent}%`;
    atEndpoint = percent === 0 || percent === 100;
    percentage.textContent = text;
    expandedPercentage.textContent = text;
    root.style.setProperty('--reading-progress', `${progress * 100}%`);
    updateMode();
  }

  // Cubic segments follow a Gaussian bulge, keeping the thread tangent continuous.
  function xAt(y: number) {
    const amplitude = restingBend + Math.max(0, bend);
    return railX + amplitude * Math.exp(-((y - position) ** 2) / (2 * bendRadius ** 2));
  }

  function slopeAt(y: number) {
    return -(xAt(y) - railX) * (y - position) / bendRadius ** 2;
  }

  function point(x: number, y: number) {
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  function path(from: number, to: number) {
    let d = `M ${point(xAt(from), from)}`;
    for (let y = from; y < to; y += segmentLength) {
      const next = Math.min(y + segmentLength, to);
      const step = (next - y) / 3;
      const firstControl = point(xAt(y) + slopeAt(y) * step, y + step);
      const secondControl = point(xAt(next) - slopeAt(next) * step, next - step);
      d += ` C ${firstControl}, ${secondControl}, ${point(xAt(next), next)}`;
    }
    return d;
  }

  function draw() {
    track.setAttribute('d', path(0, height));
    accent.setAttribute('d', path(Math.max(0, position - bendRadius), Math.min(height, position + bendRadius)));
    nodes.forEach((node, i) => {
      const y = nodePositions[i] * height;
      node.setAttribute('cx', String(xAt(y)));
      node.setAttribute('cy', String(y));
    });
    const labelX = xAt(position) + labelGap;
    const labelY = clamp(position - 10, 0, Math.max(0, height - labelHeight));
    label.style.transform = `translate(${labelX}px, ${labelY}px)`;
  }

  function tick(time: number) {
    frame = 0;
    if (!desktop.matches || document.hidden) return;
    const dt = Math.min((time - lastTime) / 1000 || 1 / 60, 1 / 30);
    lastTime = time;
    if (reduced.matches) {
      position = target;
      velocity = bend = bendVelocity = bendTarget = 0;
    } else {
      velocity += ((target - position) * 240 - velocity * 28) * dt;
      position = clamp(position + velocity * dt, 0, height);
      bendVelocity += ((bendTarget - bend) * 220 - bendVelocity * 22) * dt;
      bend += bendVelocity * dt;
      bendTarget *= Math.exp(-dt * 9);
    }
    const moving = Math.abs(target - position) > .05
      || Math.abs(velocity) > .05
      || Math.abs(bend) > .02
      || Math.abs(bendVelocity) > .05;
    if (!moving) {
      position = target;
      bend = 0;
    }
    draw();
    if (moving) frame = requestAnimationFrame(tick);
  }

  function animate() {
    if (frame || !desktop.matches || document.hidden) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function measure() {
    measureFrame = 0;
    if (!desktop.matches) return;
    const scroll = window.scrollY;
    readingOffset = Math.max(parseFloat(getComputedStyle(root).top), window.innerHeight * .18);
    const bounds = prose!.getBoundingClientRect();
    start = bounds.top + scroll - readingOffset;
    end = Math.min(bounds.bottom + scroll - innerHeight + 24, document.documentElement.scrollHeight - innerHeight);
    offsets = headings.map((heading) => heading!.getBoundingClientRect().top + scroll);
    height = Math.max(1, rail.clientHeight);
    const width = Math.max(1, rail.clientWidth);
    nodePositions = offsets.map((top) => clamp((top - readingOffset - start) / Math.max(1, end - start)));
    // Several final headings can share the last scroll position. Keep their dots distinct.
    const gap = Math.min(8 / height, 1 / (nodes.length + 1));
    for (let i = nodePositions.length - 2; i >= 0; i--) {
      nodePositions[i] = Math.max(0, Math.min(nodePositions[i], nodePositions[i + 1] - gap));
    }
    label.style.width = `${Math.max(60, width - 52)}px`;
    labelHeight = label.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    readPosition();
    position = target;
    velocity = 0;
    draw();
    placeActiveMark();
  }

  function scheduleMeasure() {
    if (!measureFrame && desktop.matches) measureFrame = requestAnimationFrame(measure);
  }

  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (desktop.matches) {
      root.setAttribute('data-reading-toc', '');
      root.tabIndex = 0;
      lastScroll = window.scrollY;
      updateMode();
      scheduleMeasure();
    } else {
      root.removeAttribute('data-reading-toc');
      root.removeAttribute('data-toc-open');
      root.removeAttribute('tabindex');
    }
  }

  function trackPointer(event: PointerEvent) {
    if (!desktop.matches || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    keyboardNavigation = false;
    updateMode();
  }

  function clearPointer() {
    pointer = undefined;
    updateMode();
  }

  document.addEventListener('pointermove', trackPointer, { passive: true });
  document.addEventListener('pointerdown', trackPointer, { passive: true });
  document.addEventListener('pointerleave', clearPointer);
  window.addEventListener('blur', clearPointer);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') { keyboardNavigation = true; updateMode(); }
  });
  root.addEventListener('focusin', updateMode);
  root.addEventListener('focusout', () => queueMicrotask(updateMode));
  root.querySelector('.toc-panel')!.addEventListener('scroll', placeActiveMark, { passive: true });
  window.addEventListener('scroll', () => {
    if (!desktop.matches) return;
    const delta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (!reduced.matches) bendTarget = clamp(bendTarget + Math.abs(delta) * .16, 0, 24);
    readPosition();
    animate();
  }, { passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(prose);
  observer.observe(root);
  prose.addEventListener('load', scheduleMeasure, true);
  document.fonts.ready.then(scheduleMeasure);
  desktop.addEventListener('change', configure);
  reduced.addEventListener('change', () => { bendTarget = 0; animate(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else scheduleMeasure();
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    frame = measureFrame = 0;
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) configure(); });
  configure();
}
