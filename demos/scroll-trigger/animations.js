document.addEventListener('DOMContentLoaded', init);

function init() {
  let background = document.querySelector('.background');
  let points = [
    {transform: 'translate(-50%, -50%) scale(0.4)'},
    {transform: 'translate(-14%, -46%) scale(1)'}, // Eiffel tower
    {transform: 'translate(-60%, -42%) scale(1)'}, // Ferris wheel
    {transform: 'translate(-68%, -35%) scale(0.7)'}, // Some construction
    {transform: 'translate(-50%, -50%) scale(0.4)'},
  ];
  background.style.transform = points[0].transform;
  for (let i = 1; i < points.length; i++) {
    let anchor = document.getElementById(`anchor${i}`);
    let trigger = function() {
      return anchor.getBoundingClientRect().top < window.innerHeight;
    }
    let anim = background.animate([
      points[i - 1],
      points[i],
    ], {
      duration: 1200,
      fill: 'forwards',
      easing: 'ease-in-out',
      startDelay: 1,
    });
    scrollTriggerAnimation(document.scrollingElement, anim, trigger);
  }
}