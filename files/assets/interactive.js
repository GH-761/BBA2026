/* ============================================================
   BBA 2026 — Interactive Poster Components (vanilla JS)
   ============================================================
   Public API:
   - InteractivePoster.studiesTable(rootEl, dataArr, schemaObj)
   - InteractivePoster.barChart(canvasEl, configObj)
   - InteractivePoster.mechAnim(rootEl, stepsArr)
   - InteractivePoster.statTiles(rootEl)
   - InteractivePoster.barriers(rootEl)
   - InteractivePoster.timeline(rootEl, configObj)
*/
const InteractivePoster = (function() {

  // ============================================================
  // STUDIES TABLE — sortable, filterable, expandable rows
  // ============================================================
  function studiesTable(rootEl, data, schema) {
    const state = {
      sortKey: null,
      sortDir: 'asc',
      filters: new Set(),  // active filter keys (must ALL match)
      expanded: new Set(), // expanded row indices
    };

    const filterPills = schema.filters || [];
    const columns = schema.columns;

    function render() {
      let filtered = data.slice();
      if (state.filters.size > 0) {
        filtered = filtered.filter(row => {
          for (const fkey of state.filters) {
            const f = filterPills.find(p => p.key === fkey);
            if (!f.test(row)) return false;
          }
          return true;
        });
      }
      if (state.sortKey) {
        filtered.sort((a, b) => {
          const av = a[state.sortKey], bv = b[state.sortKey];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === 'number' && typeof bv === 'number') {
            return state.sortDir === 'asc' ? av - bv : bv - av;
          }
          return state.sortDir === 'asc'
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }

      let html = '';

      // Filter pills
      if (filterPills.length) {
        html += '<div class="filter-pills">';
        html += `<button class="filter-pill ${state.filters.size===0?'active':''}" data-fkey="">All studies</button>`;
        for (const p of filterPills) {
          const active = state.filters.has(p.key) ? 'active' : '';
          html += `<button class="filter-pill ${active}" data-fkey="${p.key}">${p.label}</button>`;
        }
        html += '</div>';
      }

      // Table
      html += '<div class="studies-table-wrap"><table class="studies"><thead><tr>';
      for (const c of columns) {
        const sortCls = state.sortKey === c.key ?
          (state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : '';
        html += `<th class="${sortCls}" data-sortkey="${c.key}" style="${c.style||''}">${c.label}<span class="sort-indicator"></span></th>`;
      }
      html += '</tr></thead><tbody>';

      filtered.forEach((row, idx) => {
        const isExpanded = state.expanded.has(row._id);
        html += `<tr data-rid="${row._id}" class="${isExpanded?'expanded':''}">`;
        for (const c of columns) {
          let cellHtml = '';
          if (c.render) {
            cellHtml = c.render(row);
          } else {
            cellHtml = row[c.key] != null ? String(row[c.key]) : '';
          }
          html += `<td class="${c.cellClass||''}">${cellHtml}</td>`;
        }
        html += '</tr>';
        if (isExpanded) {
          html += `<tr class="detail-row"><td colspan="${columns.length}"><div class="detail-inner">${row.detailHtml||''}</div></td></tr>`;
        }
      });

      html += '</tbody></table></div>';
      if (filtered.length === 0) {
        html += '<p style="margin:14px 0; color:var(--ink-soft); font-style:italic;">No studies match the current filters.</p>';
      }
      rootEl.innerHTML = html;
    }

    rootEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (pill) {
        const key = pill.dataset.fkey;
        if (key === '') {
          state.filters.clear();
        } else {
          if (state.filters.has(key)) state.filters.delete(key);
          else state.filters.add(key);
        }
        render();
        return;
      }
      const th = e.target.closest('th[data-sortkey]');
      if (th) {
        const key = th.dataset.sortkey;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = 'asc';
        }
        render();
        return;
      }
      const row = e.target.closest('tr[data-rid]');
      if (row) {
        const id = parseInt(row.dataset.rid, 10);
        if (state.expanded.has(id)) state.expanded.delete(id);
        else state.expanded.add(id);
        render();
      }
    });

    render();
  }

  // ============================================================
  // ANIMATED MECHANISM — reveal nodes/arrows in sequence
  // ============================================================
  function mechAnim(rootEl, totalSteps) {
    const playBtn = rootEl.querySelector('.mech-play');
    const stepLabel = rootEl.querySelector('.mech-step');
    const nodes = Array.from(rootEl.querySelectorAll('.mech-svg [data-step]'));
    let timer = null;
    let cur = 0;

    function reset() {
      for (const el of nodes) el.classList.remove('visible');
      cur = 0;
      if (stepLabel) stepLabel.textContent = 'Press Play';
      playBtn.textContent = '▶ Play';
    }

    function step() {
      cur++;
      if (cur > totalSteps) {
        if (stepLabel) stepLabel.textContent = 'Complete · click to replay';
        playBtn.textContent = '↺ Replay';
        clearInterval(timer);
        timer = null;
        return;
      }
      for (const el of nodes) {
        const s = parseInt(el.dataset.step, 10);
        if (s <= cur) el.classList.add('visible');
      }
      if (stepLabel) stepLabel.textContent = `Step ${cur} of ${totalSteps}`;
    }

    playBtn.addEventListener('click', () => {
      if (timer) { clearInterval(timer); timer = null; }
      if (cur >= totalSteps) reset();
      step();  // immediate first step
      timer = setInterval(step, 900);
    });

    reset();
  }

  // ============================================================
  // STAT TILES — click to expand
  // ============================================================
  function statTiles(rootEl) {
    rootEl.addEventListener('click', (e) => {
      const tile = e.target.closest('.stat-tile');
      if (!tile) return;
      tile.classList.toggle('expanded');
    });
  }

  // ============================================================
  // BARRIER CARDS — click to expand
  // ============================================================
  function barriers(rootEl) {
    rootEl.addEventListener('click', (e) => {
      const card = e.target.closest('.barrier');
      if (!card) return;
      card.classList.toggle('expanded');
    });
  }

  // ============================================================
  // DRAGGABLE TIMELINE
  // ============================================================
  function timeline(rootEl, config) {
    const points = config.points;  // [{x:0-1, label, days, readout: {h4, body}}]
    const tlEl = rootEl.querySelector('.timeline');
    const readout = rootEl.querySelector('.timeline-readout');
    const handle = tlEl.querySelector('.handle');
    const handleLabel = tlEl.querySelector('.handle-label');
    let dragging = false;
    let curPoint = 0;

    function setPoint(idx) {
      curPoint = Math.max(0, Math.min(points.length - 1, idx));
      const p = points[curPoint];
      const pct = p.x * 100;
      handle.style.left = `calc(${pct}% * 0.93 + 30px)`;  // account for axis padding 30px
      handleLabel.style.left = `calc(${pct}% * 0.93 + 30px)`;
      handleLabel.textContent = p.label;
      readout.innerHTML = `<h4>${p.readout.h4}</h4><p>${p.readout.body}</p>`;
    }

    function setFromX(clientX) {
      const rect = tlEl.getBoundingClientRect();
      const rel = (clientX - rect.left - 30) / (rect.width - 60);
      // snap to nearest point
      let best = 0, bestD = 99;
      points.forEach((p, i) => {
        const d = Math.abs(p.x - rel);
        if (d < bestD) { bestD = d; best = i; }
      });
      setPoint(best);
    }

    handle.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    handle.addEventListener('touchstart', (e) => { dragging = true; }, {passive:true});
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('touchend', () => { dragging = false; });
    document.addEventListener('mousemove', (e) => { if (dragging) setFromX(e.clientX); });
    document.addEventListener('touchmove', (e) => {
      if (dragging && e.touches[0]) setFromX(e.touches[0].clientX);
    }, {passive:true});
    tlEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('handle')) return;
      setFromX(e.clientX);
    });

    setPoint(0);
  }

  return { studiesTable, mechAnim, statTiles, barriers, timeline };
})();
