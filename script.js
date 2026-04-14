/* ============================================
   婚礼邀请函 H5 — JavaScript（清新版）
   林少雄 & 刘珍妮
   ============================================ */

(function () {
  'use strict';

  // ==================== 配置 ====================
  const CONFIG = {
    // 👇 修改为你的婚礼日期时间
    weddingDate: '2026-06-01 11:58:00',
    // 花瓣数量
    petalCount: 12,
    // 默认宾客称呼
    defaultGuestName: '尊贵的宾客',
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ==================== 1. 宾客姓名 ====================
  function initGuestName() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || params.get('guest') || params.get('n');

    if (name && name.trim()) {
      const decoded = decodeURIComponent(name.trim());
      // 设置所有宾客姓名位置
      const el1 = $('#guest-name');
      const el2 = $('#guest-name-2');
      const el3 = $('#env-guest-name');
      if (el1) el1.textContent = decoded;
      if (el2) el2.textContent = decoded;
      if (el3) el3.textContent = decoded;
      document.title = `${decoded}亲启 — 林少雄&刘珍妮的婚礼邀请`;
    }
  }

  // ==================== 信封封面 ====================
  function initEnvelope() {
    const cover = $('#envelope-cover');
    const seal = $('#env-seal');
    if (!cover || !seal) return;

    // 锁定滚动
    document.body.classList.add('envelope-locked');

    // 点击印章打开信封
    seal.addEventListener('click', openEnvelope);
    // 也允许点击任意位置打开（延迟，让印章动画先播完）
    setTimeout(() => {
      cover.addEventListener('click', openEnvelope);
    }, 2500);
  }

  function openEnvelope() {
    const cover = $('#envelope-cover');
    if (!cover || cover.classList.contains('opening')) return;

    // 触发开启动画
    cover.classList.add('opening');

    // 尝试播放音乐
    const audio = $('#bg-music');
    const btn = $('#music-toggle');
    if (audio) {
      audio.play().then(() => {
        btn && btn.classList.remove('paused');
      }).catch(() => {});
    }

    // 动画结束后移除信封
    setTimeout(() => {
      document.body.classList.remove('envelope-locked');
      cover.classList.add('hidden');
    }, 1000);
  }

  // ==================== 2. 滚动入场动画 ====================
  function initScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    $$('.anim-fade-up').forEach((el) => observer.observe(el));
  }

  // ==================== 3. 倒计时 ====================
  function initCountdown() {
    const target = new Date(CONFIG.weddingDate).getTime();

    function update() {
      const diff = target - Date.now();
      if (diff <= 0) {
        $('#cd-days').textContent = '0';
        $('#cd-hours').textContent = '00';
        $('#cd-mins').textContent = '00';
        $('#cd-secs').textContent = '00';
        return;
      }

      $('#cd-days').textContent = Math.floor(diff / 86400000);
      $('#cd-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      $('#cd-mins').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      $('#cd-secs').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // ==================== 4. 背景音乐 ====================
  function initMusic() {
    const btn = $('#music-toggle');
    const audio = $('#bg-music');
    let playing = false;

    function tryPlay() {
      if (playing) return;
      audio.play().then(() => {
        playing = true;
        btn.classList.remove('paused');
      }).catch(() => {});
    }

    btn.addEventListener('click', () => {
      if (playing) {
        audio.pause();
        playing = false;
        btn.classList.add('paused');
      } else {
        audio.play().then(() => {
          playing = true;
          btn.classList.remove('paused');
        }).catch(() => {});
      }
    });

    // 微信自动播放
    if (typeof WeixinJSBridge !== 'undefined') {
      WeixinJSBridge.invoke('getNetworkType', {}, () => tryPlay());
    } else {
      document.addEventListener('WeixinJSBridgeReady', () => {
        WeixinJSBridge.invoke('getNetworkType', {}, () => tryPlay());
      });
    }

    document.addEventListener('touchstart', tryPlay, { once: true });
    document.addEventListener('click', tryPlay, { once: true });
  }

  // ==================== 5. 飘落花瓣 ====================
  function initPetals() {
    const container = $('#petals-container');
    const types = ['petal-pink', 'petal-white', 'petal-green'];

    for (let i = 0; i < CONFIG.petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = `petal ${types[i % types.length]}`;

      const left = Math.random() * 100;
      const size = 6 + Math.random() * 8;
      const duration = 10 + Math.random() * 15;
      const delay = Math.random() * duration;
      const drift = (Math.random() - 0.5) * 120;
      const rotate = Math.random() * 540 - 270;

      Object.assign(petal.style, {
        left: `${left}%`,
        width: `${size}px`,
        height: `${size * 0.75}px`,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
      });
      petal.style.setProperty('--drift', `${drift}px`);
      petal.style.setProperty('--rotate', `${rotate}deg`);

      container.appendChild(petal);
    }
  }

  // ==================== 6. 祝福留言 (localStorage) ====================
  function initBlessings() {
    const input = $('#bless-input');
    const sendBtn = $('#bless-send');
    const list = $('#bless-list');

    // 从 localStorage 加载
    const saved = JSON.parse(localStorage.getItem('wedding_blessings') || '[]');
    saved.forEach((b) => addBlessingDOM(b));

    sendBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;

      const blessing = {
        author: getGuestName(),
        text: text,
        emoji: ['🎉', '❤️', '💕', '🥂', '💒'][Math.floor(Math.random() * 5)],
        color: ['#f0b8b8', '#b8d4f0', '#d4f0b8', '#f0d8b8', '#d4b8f0'][Math.floor(Math.random() * 5)],
      };

      saved.push(blessing);
      localStorage.setItem('wedding_blessings', JSON.stringify(saved));
      addBlessingDOM(blessing);
      input.value = '';

      // 滚动到新留言
      list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // 回车发送
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendBtn.click();
    });
  }

  function addBlessingDOM(b) {
    const list = $('#bless-list');
    const html = `
      <div class="bless-item anim-fade-up visible">
        <div class="bless-avatar" style="background:${b.color}">${b.author.charAt(0)}</div>
        <div class="bless-content">
          <p class="bless-author">${escapeHtml(b.author)}</p>
          <p class="bless-text">${escapeHtml(b.text)}</p>
        </div>
        <div class="bless-emoji">${b.emoji}</div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
  }

  function getGuestName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name') || params.get('guest') || '匿名宾客';
  }

  function escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  }

  // ==================== 7. 首屏动画 ====================
  function initHeroAnimations() {
    setTimeout(() => {
      $$('#hero .anim-fade-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 200);
      });
    }, 300);
  }

  // ==================== 初始化 ====================
  function init() {
    initGuestName();
    initEnvelope();
    initHeroAnimations();
    initScrollAnimations();
    initCountdown();
    initMusic();
    initPetals();
    initBlessings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
