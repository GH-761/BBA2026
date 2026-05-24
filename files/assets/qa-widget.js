/* ============================================================
   BBA 2026 — AI Q&A Widget (vanilla JS, no framework)
   ============================================================
   Usage: in poster page <body>, include:
     <script>
       window.BBA_QA_CONFIG = {
         workerUrl: 'https://bba-2026-qa.gh-b03.workers.dev',
         posterId: 'p117',   // or 'p111'
         suggestions: ['Question 1?', 'Question 2?', ...]
       };
     </script>
     <script src="../assets/qa-widget.js"></script>
*/
(function() {
  'use strict';

  const config = window.BBA_QA_CONFIG || {};
  if (!config.workerUrl || !config.posterId) {
    console.warn('BBA_QA_CONFIG missing workerUrl or posterId; Q&A widget disabled.');
    return;
  }

  // Conversation state — kept in sessionStorage so opening/closing the panel preserves it
  const SESSION_KEY = 'bba-qa-' + config.posterId;
  let history = [];
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) history = JSON.parse(stored) || [];
  } catch (e) { history = []; }
  function persist() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(history)); } catch(e) {}
  }

  // ============================================================
  // Build the widget DOM
  // ============================================================
  const launcher = document.createElement('button');
  launcher.className = 'qa-launcher';
  launcher.setAttribute('aria-label', 'Ask a question about this poster');
  launcher.innerHTML = `
    <span class="qa-icon">?</span>
    <span>Ask Claude about this poster</span>
  `;
  document.body.appendChild(launcher);

  const backdrop = document.createElement('div');
  backdrop.className = 'qa-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('div');
  panel.className = 'qa-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Q&A about this poster');
  panel.innerHTML = `
    <div class="qa-header">
      <div class="qa-header-text">
        <span class="qa-header-label">Ask · ${config.posterId.toUpperCase()}</span>
        <span class="qa-header-title">Evidence assistant</span>
      </div>
      <button class="qa-close" aria-label="Close">×</button>
    </div>
    <div class="qa-messages" id="qa-messages"></div>
    <div class="qa-input-row">
      <textarea class="qa-input" placeholder="Ask anything about this poster…" rows="1" maxlength="500"></textarea>
      <button class="qa-send">Send</button>
    </div>
    <div class="qa-disclaimer">
      Answers are grounded in this poster's evidence base. Claude can make mistakes.
    </div>
  `;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#qa-messages');
  const inputEl = panel.querySelector('.qa-input');
  const sendBtn = panel.querySelector('.qa-send');
  const closeBtn = panel.querySelector('.qa-close');

  // ============================================================
  // Open / close handlers
  // ============================================================
  function open() {
    panel.classList.add('open');
    backdrop.classList.add('open');
    launcher.classList.add('hidden');
    setTimeout(() => inputEl.focus(), 100);
    renderMessages();
    scrollToBottom();
  }
  function close() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    launcher.classList.remove('hidden');
  }
  launcher.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  // ============================================================
  // Rendering
  // ============================================================
  function renderMessages() {
    messagesEl.innerHTML = '';
    if (history.length === 0) {
      // Intro + suggestions
      const intro = document.createElement('div');
      intro.className = 'qa-intro';
      intro.innerHTML = `
        <p>Ask anything about this poster's evidence base — included studies, key findings, methodology, gaps, or implications.</p>
        <p style="margin-bottom:6px; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent-deep); font-weight:700;">Try these:</p>
      `;
      const suggDiv = document.createElement('div');
      suggDiv.className = 'qa-suggestions';
      (config.suggestions || []).forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'qa-suggestion';
        btn.textContent = s;
        btn.addEventListener('click', () => {
          inputEl.value = s;
          send();
        });
        suggDiv.appendChild(btn);
      });
      intro.appendChild(suggDiv);
      messagesEl.appendChild(intro);
    } else {
      for (const turn of history) {
        const div = document.createElement('div');
        div.className = 'qa-msg ' + turn.role;
        if (turn.role === 'assistant') {
          div.innerHTML = formatAssistantText(turn.content);
        } else {
          div.textContent = turn.content;
        }
        messagesEl.appendChild(div);
      }
    }
  }

  function formatAssistantText(text) {
    // Escape HTML
    let safe = text.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    // **bold** -> <strong>
    safe = safe.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    // [Author Year] or [ref X] -> styled citation pill
    safe = safe.replace(/\[([^\]\n]{1,40})\]/g, '<span class="qa-cite">[$1]</span>');
    // Paragraph breaks
    safe = safe.split(/\n\n+/).map(p => p.replace(/\n/g, '<br>')).join('</p><p>');
    return '<p>' + safe + '</p>';
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  // ============================================================
  // Input auto-grow + send-on-Enter
  // ============================================================
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(120, inputEl.scrollHeight) + 'px';
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener('click', send);

  // ============================================================
  // Send a question
  // ============================================================
  let inFlight = false;
  async function send() {
    if (inFlight) return;
    const question = inputEl.value.trim();
    if (!question || question.length > 500) return;

    history.push({ role: 'user', content: question });
    persist();
    inputEl.value = '';
    inputEl.style.height = 'auto';
    renderMessages();
    scrollToBottom();

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'qa-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    scrollToBottom();

    inFlight = true;
    sendBtn.disabled = true;

    // Build history for the request (exclude the most recent user turn — sent as `question`)
    const reqHistory = history.slice(0, -1);

    try {
      const resp = await fetch(config.workerUrl + '/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posterId: config.posterId,
          question: question,
          history: reqHistory,
        }),
      });

      if (!resp.ok) {
        // Try to parse error JSON
        let errMsg = `Sorry, an error occurred (HTTP ${resp.status}).`;
        try {
          const errJson = await resp.json();
          if (errJson.message) errMsg = errJson.message;
        } catch (e) {}
        typing.remove();
        showError(errMsg);
        return;
      }

      // Stream the response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      // Replace typing indicator with empty assistant bubble
      typing.remove();
      const bubble = document.createElement('div');
      bubble.className = 'qa-msg assistant';
      bubble.innerHTML = '<p></p>';
      messagesEl.appendChild(bubble);
      const bubbleP = bubble.querySelector('p');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE format: lines starting with "data: ..."
        const lines = buffer.split('\n');
        buffer = lines.pop();  // keep partial last line in buffer
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const evt = JSON.parse(dataStr);
            if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
              answer += evt.delta.text;
              // Update bubble live
              bubble.innerHTML = formatAssistantText(answer);
              scrollToBottom();
            }
          } catch (e) { /* ignore non-JSON lines */ }
        }
      }

      // Final render
      if (!answer.trim()) {
        bubble.remove();
        showError('Sorry, I didn\'t get a response. Please try again.');
      } else {
        bubble.innerHTML = formatAssistantText(answer);
        history.push({ role: 'assistant', content: answer });
        persist();
      }
    } catch (err) {
      typing.remove();
      console.error('QA error', err);
      showError('Connection failed. Please check your internet and try again.');
    } finally {
      inFlight = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
  }

  function showError(msg) {
    const e = document.createElement('div');
    e.className = 'qa-msg error';
    e.textContent = msg;
    messagesEl.appendChild(e);
    scrollToBottom();
  }
})();
