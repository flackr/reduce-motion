/**
 * Create a scroll-linked animation
 * @param {Element} scroller
 * @param {Element} element
 * @param {Object} animation
 */
function scrollLinkAnimation(scroller, animation, progress) {
  animation.pause();
  let duration = animation.effect.getComputedTiming().duration;
  function update() {
    animation.currentTime = progress() * duration;
  }
  update();
  if (scroller == document.scrollingElement) {
    window.addEventListener('scroll', update);
  } else {
    scroller.addEventListener('scroll', update);
  }
}

/**
 * Create a scroll-triggered animation
 * @param {source: Element, offsets: Object?, view: Element?, fit: Boolean} scrollOptions
 * @param {Element} element
 * @param {Object} keyframes
 * @param {Object} options
 */
function scrollTriggeredAnimation(scrollOptions, element, keyframes, options) {

}