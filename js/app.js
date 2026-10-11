// 设置 tabs 标签
function setTabs() {
  $(".tabs .nav-tabs").on("click", "a", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const $tab = $(e.target.parentElement.parentElement.parentElement);
    $tab.find(".nav-tabs .active").removeClass("active");
    $tab.find(e.target.parentElement).addClass("active");
    $tab.find(".tab-content .active").removeClass("active");
    $tab.find($(e.target).attr("class")).addClass("active");
    return false;
  });
}

// 每次进入首页都重新抽取，不重复推荐同一篇文章。
function setRandomArticles() {
  var section = document.querySelector('.topArticle[data-random-count]');
  if (!section) return;

  var pool = section.querySelector('.random-article-pool');
  var articles = section.querySelector('.articles');
  if (!pool || !articles) return;

  var candidates = Array.prototype.slice.call(pool.content.children);
  var count = Math.min(Number(section.dataset.randomCount) || 3, candidates.length);
  var selected = document.createDocumentFragment();
  for (var i = 0; i < count; i++) {
    var index = i + Math.floor(Math.random() * (candidates.length - i));
    var candidate = candidates[index];
    candidates[index] = candidates[i];
    candidates[i] = candidate;
    selected.appendChild(candidate.cloneNode(true));
  }
  articles.textContent = '';
  articles.appendChild(selected);

  // 新插入的链接需要加入页面无刷新导航。
  if (window.pjax) window.pjax.refresh(articles);
}

setRandomArticles();

$(function () {
  setTabs();
});

document.addEventListener('pjax:complete', function () {
  setRandomArticles();
  setTabs();
});
