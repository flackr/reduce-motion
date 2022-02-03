const elementAnimate = Element.prototype.animate;

const MOTION_NONE = 0;
const MOTION_NEAREST = 1;
const MOTION_CROSSFADE = 2;
const MOTION_FULL = 3;

// The proportion of real progress shown.
const CROSSFADE_PROGRESS = 0.1;

let longhands = function(property) {
  return [property, `${property}Top`, `${property}Left`, `${property}Right`, `${property}Bottom`];
}

const NON_PROPERTIES = ['offset'];
const MOTION_PROPERTIES = ['transform', 'left', 'top', 'right', 'bottom', 'filter', 'width', 'height', 'background-position'].concat(
    longhands('margin')).concat(longhands('padding')).concat(longhands('border'));

// A description of each mode.
const ANIMATION_MODES = [
  ['No animation', [MOTION_NONE, true]],
  ['Non-motion only', [MOTION_NONE, false]],
  ['Nearest keyframe', [MOTION_NEAREST, true]],
  ['Nearest motion keyframe', [MOTION_NEAREST, false]],
  ['Crossfade', [MOTION_CROSSFADE, true]],
  ['Crossfade motion', [MOTION_CROSSFADE, false]],
  ['Full animation', [MOTION_FULL, true]],
];
let animationMode = MOTION_FULL;

let clones = new WeakMap();

let getKeyframeOffsets = function(keyframes) {
  let offsets = [];
  let lastOffset = 0;
  let lastOffsetIndex = 0;
  if (keyframes.length == 1) {
    if (keyframes[0].offset === undefined || keyframes[0].offset == 1) {
      return [0, 1];
    }
    if (keyframes[0].offset == 0) {
      return [0, 1];
    }
    return [0, keyframes[0].offset, 1];
  }
  let nextOffsetIndex = [];
  while (nextOffsetIndex.length < keyframes.length)
    nextOffsetIndex.push(keyframes.length - 1);
  for (let i = keyframes.length - 2; i >= 0; --i) {
    if (keyframes[i].offset === undefined) {
      nextOffsetIndex[i] = nextOffsetIndex[i + 1];
    } else {
      nextOffsetIndex[i] = i;
    }
  }
  for (let i = 0; i < keyframes.length; i++) {
    let offset = keyframes[i].offset;
    if (offset === undefined) {
      if (i == 0) {
        offset = 0;
      } else {
        let nextIndex = nextOffsetIndex[i];
        let nextOffset = keyframes[nextIndex].offset || 1;
        offset = lastOffset + (i - lastOffsetIndex) / (nextIndex - lastOffsetIndex) * (nextOffset - lastOffset);
      }
    } else {
      lastOffset = offset;
      lastOffsetIndex = i;
    }
    offsets.push(offset);
  }
  return offsets;
}

Element.prototype.animate = function(keyframes, options) {
  let node = this;
  let clone = null;
  if (clones.has(node)) {
    clone = clones.get(node);
  } else {
    clone = this.cloneNode(true);
    clones.set(node, clone);
    clone.style.display = 'none';
    clone.style.position = getComputedStyle(node).position == 'fixed' ? 'fixed' : 'absolute';
    clone.style.width = `${this.clientWidth}px`;
    clone.style.height = `${this.clientHeight}px`;
    this.style.mixBlendMode = 'plus-lighter';
    this.parentNode.insertBefore(clone, this);
  }

  let duration = (options instanceof Object) ? options.duration : options;
  let iterations = (options instanceof Object) ? (options.iterations || 1) : 1;

  let offsets = getKeyframeOffsets(keyframes);
  let nonMotionKeyframes = [];
  let motionKeyframes = [];
  for (let i = 0; i < keyframes.length; i++) {
    let nonMotionKeyframe = {};
    let motionKeyframe = {};
    for (let prop in keyframes[i]) {
      if (NON_PROPERTIES.indexOf(prop) != -1) {
        motionKeyframe[prop] = keyframes[i][prop];
        nonMotionKeyframe[prop] = keyframes[i][prop];
        continue;
      }
      if (MOTION_PROPERTIES.indexOf(prop) != -1) {
        motionKeyframe[prop] = keyframes[i][prop];
      } else {
        nonMotionKeyframe[prop] = keyframes[i][prop];
      }
    }
    nonMotionKeyframes.push(nonMotionKeyframe);
    motionKeyframes.push(motionKeyframe);
  }

  function setOpacity(opacity) {
    node.style.filter = `opacity(${Math.round(opacity * 100)}%)`;
    clone.style.filter = `opacity(${Math.round((1 - opacity) * 100)}%)`;
  }

  let dummyAnimation = elementAnimate.apply(this, [{}, options]);
  let realNonMotionAnimation = elementAnimate.apply(this, [nonMotionKeyframes, options]);
  let realMotionAnimation = elementAnimate.apply(this, [motionKeyframes, options]);
  let cloneMotionAnimation = elementAnimate.apply(clone, [motionKeyframes, options]);
  let cloneNonMotionAnimation = elementAnimate.apply(clone, [nonMotionKeyframes, options]);

  realMotionAnimation.pause();
  realNonMotionAnimation.pause();
  cloneMotionAnimation.pause();
  cloneNonMotionAnimation.pause();
  let running = true;
  let lastProgress = null;
  let raf = function() {
    requestAnimationFrame(raf);
    let progress = dummyAnimation.currentTime / duration;
    if (progress > 0 && progress < 1)
      console.log(progress);
    if (progress == lastProgress ||
        (lastProgress < 0 && progress < 0) ||
        (lastProgress > 1 && progress > 1)) {
      return;
    }
    // Copy the playback rate to ensure that fill effects are correct.
    realNonMotionAnimation.playbackRate = realMotionAnimation.playbackRate = cloneMotionAnimation.playbackRate = cloneNonMotionAnimation.playbackRate = dummyAnimation.playbackRate;
    lastProgress = progress;
    if (animationMode[0] == MOTION_CROSSFADE) {
      clone.style.display = getComputedStyle(node).display;
    } else {
      clone.style.display = 'none';
      setOpacity(1);
    }
    switch (animationMode[0]) {
      case MOTION_NONE: {
        realMotionAnimation.currentTime = duration;
        break;
      }
      case MOTION_NEAREST: {
        // This assumes no iterations on animation.
        if (progress >= 1 || progress < 0) {
          cloneMotionAnimation.currentTime = realMotionAnimation.currentTime = progress * duration;
          setOpacity(1);
          break;
        }
        let nextIndex = 1;
        for (; nextIndex < offsets.length - 1; ++nextIndex) {
          if (offsets[nextIndex] >= progress) break;
        }
        let p1 = offsets[nextIndex - 1];
        let p2 = offsets[nextIndex];
        let p = (progress - p1) / (p2 - p1);
        realMotionAnimation.currentTime = (p < 0.5 ? p1 : p2) * duration;
        break;
      }
      case MOTION_CROSSFADE: {
        // This assumes no iterations on animation.
        if (progress > 1 || progress < 0) {
          cloneMotionAnimation.currentTime = realMotionAnimation.currentTime = progress * duration;
          setOpacity(1);
          break;
        }
        let nextIndex = 1;
        for (; nextIndex < offsets.length - 1; ++nextIndex) {
          if (offsets[nextIndex] >= progress) break;
        }
        function interp(p, p1, p2) {
          return p1 + p * (p2 - p1);
        }
        let p1 = offsets[nextIndex - 1];
        let p2 = offsets[nextIndex];
        let p = (progress - p1) / (p2 - p1);
        let t = interp(p * CROSSFADE_PROGRESS, p1, p2);
        let t2 = (t + (1 - CROSSFADE_PROGRESS) * (p2 - p1));
        realMotionAnimation.currentTime =  t * duration;
        cloneMotionAnimation.currentTime = t2 * duration;
        setOpacity(1 - p);
        break;
      }
      case MOTION_FULL: {
        realMotionAnimation.currentTime = dummyAnimation.currentTime;
        break;
      }
    }
    if (animationMode[1]) {
      realNonMotionAnimation.currentTime = realMotionAnimation.currentTime;
      cloneNonMotionAnimation.currentTime = cloneMotionAnimation.currentTime;
    } else {
      realNonMotionAnimation.currentTime = dummyAnimation.currentTime;
      cloneNonMotionAnimation.currentTime = dummyAnimation.currentTime;
    }
  };
  raf();
  return dummyAnimation;
}

document.addEventListener('DOMContentLoaded', () => {
  let selectors = document.querySelectorAll('select.reduce-motion');

  for (let selector of selectors) {
    for (mode in ANIMATION_MODES) {
      let option = document.createElement('option');
      option.textContent = ANIMATION_MODES[mode][0];
      option.setAttribute('value', option);
      selector.appendChild(option);
    }
    selector.addEventListener('change', (evt) => {
      window.location.hash = selector.selectedIndex;
      selectMode(selector.selectedIndex);
    })
  }

  function selectMode(mode) {
    animationMode = ANIMATION_MODES[mode][1];
    for (let selector of selectors) {
      selector.selectedIndex = mode;
    }
  }
  if (window.location.hash) {
    selectMode(parseInt(window.location.hash.substr(1)));
  } else {
    selectMode(0);
  }
})