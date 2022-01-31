document.addEventListener('DOMContentLoaded', init);

function init() {
  let anims = [
    [document.querySelector('.feature1'), document.querySelector('.line1')],
    [document.querySelector('.feature2'), document.querySelector('.line2')],
    [document.querySelector('.feature3'), document.querySelector('.line3')],
  ];
  let scroller = document.querySelector('.phone-view');
  let container = document.querySelector('.product-view');
  let slider = document.querySelector('.sticky-view');
  let totalProgress = function() {
    return (slider.getBoundingClientRect().top - container.getBoundingClientRect().top) / (container.getBoundingClientRect().height - slider.getBoundingClientRect().height);
  }
  const TRANSITION = 0.1;
  let backgroundAnim = document.querySelector('.screen').animate([
    {backgroundImage: 'url(images/tree.jpg)'},
    {backgroundImage: 'url(images/tree.jpg)', offset: 0.33 - TRANSITION},
    {backgroundImage: 'url(images/camera.jpg)', offset: 0.33 + TRANSITION},
    {backgroundImage: 'url(images/camera.jpg)', offset: 0.66 - TRANSITION},
    {backgroundImage: 'url(images/play.png)', offset: 0.66 + TRANSITION},
    {backgroundImage: 'url(images/play.png)'},
  ], 10000);
  scrollLinkAnimation(scroller, backgroundAnim, totalProgress);
  for (let i = 0; i < anims.length; i++) {
    let progress = function() {
      let p = totalProgress();
      let p1 = i * (1 / anims.length);
      let p2 = (i + 1) * (1 / anims.length);
      return (p - p1) / (p2 - p1);
    }
    let anim1 = anims[i][0].animate([
      {opacity: 0, transform: 'translateY(50px)'},
      {opacity: 1, offset: 0.2},
      {opacity: 1, offset: 0.8},
      {opacity: 0},
    ], {
      duration: 10000,
      fill: 'both',
    });
    let anim2 = anims[i][1].animate([
      {opacity: 0, transform: 'scale(1, 0)', transformOrigin: 'bottom center'},
      {opacity: 1, transform: 'scale(1, 1)', transformOrigin: 'bottom center', offset: 0.6},
      {opacity: 1, transform: 'scale(1, 1)', transformOrigin: 'top center', offset: 0.8},
      {opacity: 0, transform: 'scale(1, 0)', transformOrigin: 'top center'},
    ], {
      duration: 10000,
      fill: 'both',
    });
    scrollLinkAnimation(scroller, anim1, progress);
    scrollLinkAnimation(scroller, anim2, progress);
  }
}