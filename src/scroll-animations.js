function onScrollChange(scroller, fn) {
  if (scroller == document.scrollingElement) {
    window.addEventListener('scroll', fn);
  } else {
    scroller.addEventListener('scroll', fn);
  }
  window.addEventListener('resize', fn);
}

/**
 * Create a scroll-linked animation
 * @param {Element} scroller
 * @param {Object} animation
 * @param {Function} progress A function which returns current progress.
 */
function scrollLinkAnimation(scroller, animation, progress) {
  animation.pause();
  let duration = animation.effect.getComputedTiming().duration;
  function update() {
    animation.currentTime = progress() * duration;
  }
  update();
  onScrollChange(scroller, update);
}

/**
 * Create a scroll-triggered animation
 * @param {Element} scroller
 * @param {Object} animation
 * @param {Function} condition Returns true if activation point has been reached.
 */
function scrollTriggerAnimation(scroller, animation, condition) {
  let current = condition();
  let duration = animation.effect.getComputedTiming().duration;
  animation.persist();
  animation.pause();
  if (current) {
    animation.currentTime = duration;
  } else {
    animation.currentTime = -1;
  }
  function update() {
    let value = condition();
    if (value == current)
      return;
    current = value;
    animation.playbackRate = current ? 1 : -1;
    animation.play();
  }
  onScrollChange(scroller, update);
}