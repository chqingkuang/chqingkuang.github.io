(function () {
  'use strict';
  if (window.blogMusicPlayer) return;
  var container = document.getElementById('blog-aplayer');
  var configElement = document.getElementById('blog-music-config');
  var fallback = document.getElementById('blog-music-fallback');
  var status = document.getElementById('blog-music-status');
  if (!container || !configElement) return;
  // Keep native controls available if the enhanced player cannot initialize.
  if (!window.APlayer) { if (status) status.hidden = true; return; }
  try {
    var options = JSON.parse(configElement.textContent);
    if (!options.audio || !options.audio.length) throw new Error('No audio tracks configured');
    options.container = container;
    options.autoplay = false;
    options.preload = 'metadata';
    var player = new APlayer(options);
    window.blogMusicPlayer = player;
    if (fallback) {
      var nativeAudio = fallback.querySelector('audio');
      nativeAudio.pause();
      nativeAudio.removeAttribute('src');
      nativeAudio.load();
      fallback.hidden = true;
    }
    container.querySelectorAll('.aplayer-play, .aplayer-icon-play').forEach(function (button) {
      button.setAttribute('aria-label', '播放或暂停背景音乐');
      button.title = '播放或暂停背景音乐';
    });
    player.on('playing', function () { if (status) status.hidden = true; });
    player.on('error', function () {
      if (!status) return;
      status.textContent = '这首音乐暂时无法播放，请切换另一首或刷新页面。';
      status.hidden = false;
    });
  } catch (error) { if (status) status.hidden = true; }
})();
