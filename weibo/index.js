(function () {
  'use strict';
  if (window.blogWeibo) { window.blogWeibo.init(); return; }
  var endpoint = 'https://v2.xxapi.cn/api/weibohot';
  var cacheKey = 'blog-weibo-hot-v2';
  var cacheLifetime = 5 * 60 * 1000;

  function readCache() {
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && Array.isArray(cached.items) && cached.items.length &&
          Date.now() - cached.time < 24 * 60 * 60 * 1000) return cached;
    } catch (error) { /* Optional cache; private browsing may block storage. */ }
    return null;
  }

  function render(root, items, message) {
    if (!root.isConnected) return;
    root.replaceChildren();
    root.setAttribute('aria-busy', 'false');
    var status = document.createElement('p');
    status.className = 'weibo-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = message;
    root.appendChild(status);
    if (items.length) {
      var list = document.createElement('ol');
      list.className = 'weibo-list';
      list.setAttribute('aria-label', '微博热搜排行榜');
      items.forEach(function (item, index) {
        var row = document.createElement('li');
        row.className = 'weibo-container';
        var rank = document.createElement('span');
        rank.className = 'order' + (index < 3 ? ' red' : '');
        rank.textContent = index + 1;
        var link = document.createElement('a');
        link.className = 'name';
        link.href = 'https://s.weibo.com/weibo?q=' + encodeURIComponent(item.title);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.title;
        link.title = item.title;
        var hot = document.createElement('span');
        hot.className = 'hot';
        hot.textContent = item.hot;
        row.append(rank, link, hot);
        list.appendChild(row);
      });
      root.appendChild(list);
    }
    var actions = document.createElement('div');
    actions.className = 'weibo-actions';
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = items.length ? '刷新热搜' : '重新加载';
    retry.addEventListener('click', function () { load(root, true); });
    var official = document.createElement('a');
    official.href = 'https://s.weibo.com/top/summary';
    official.target = '_blank';
    official.rel = 'noopener noreferrer';
    official.textContent = '完整榜单 ↗';
    actions.append(retry, official);
    root.appendChild(actions);
  }

  async function load(root, force) {
    if (root.dataset.loading === 'true') return;
    var cached = readCache();
    if (!force && cached && Date.now() - cached.time < cacheLifetime) {
      render(root, cached.items, '最近更新 · ' + new Date(cached.time).toLocaleTimeString('zh-CN'));
      return;
    }
    root.dataset.loading = 'true';
    root.setAttribute('aria-busy', 'true');
    var button = root.querySelector('button');
    if (button) button.disabled = true;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await fetch(endpoint, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('Hot search request failed');
      var data = await response.json();
      if (data.code !== 200 || !Array.isArray(data.data)) throw new Error('Invalid hot search response');
      var items = data.data.filter(function (item) {
        return item && typeof item.title === 'string' && item.title.trim();
      }).slice(0, 50).map(function (item) {
        return { title: item.title.trim(), hot: String(item.hot || '') };
      });
      if (!items.length) throw new Error('Empty hot search response');
      var time = Date.now();
      try { localStorage.setItem(cacheKey, JSON.stringify({ time: time, items: items })); } catch (error) { /* Optional cache. */ }
      render(root, items, '最近更新 · ' + new Date(time).toLocaleTimeString('zh-CN'));
    } catch (error) {
      render(root, cached ? cached.items : [], cached ?
        '暂时无法刷新，显示最近缓存 · ' + new Date(cached.time).toLocaleString('zh-CN') :
        '热搜暂时无法加载，请重试或查看完整榜单。');
    } finally {
      clearTimeout(timer);
      delete root.dataset.loading;
      if (root.isConnected) root.setAttribute('aria-busy', 'false');
    }
  }

  function init() {
    var root = document.getElementById('myWeibo');
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';
    load(root, false);
  }
  window.blogWeibo = { init: init };
  document.addEventListener('pjax:complete', init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
