# Reduce motion

## Summary

The [prefers-reduced-motion CSS media
feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
can be used to detect if the user has requested that the system minimize non-essential motion.
However, it is currently up to sites to use this query to reduce the amount of
motion they exhibit.

With the introduction of scroll timeline, we increase the risk that authors may
create effects such as full screen parallax animations which could trigger issues
[#5321](https://github.com/w3c/csswg-drafts/issues/5321). In order to mitigate
this risk, in a similar manner to [auto dark
theme](https://developer.chrome.com/blog/auto-dark-theme/) the user agent could
intervene on sites which are not known to explicitly reduce their motion levels.

The proposal is that if the user has expressed a strong need for reduced motion
the browser will forcibly reduce the amount of motion introduced by animations
which have not been explicitly marked as supporting reduced motion.

## Supporting reduced motion

If an author has designed animation effects which do not introduce a large amount of
motion or has designed motion reduced alternatives, they may declare them as they
have always done with the
[prefers-reduced-motion](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion) CSS media query:

```css
@keyframes pulse {
  from { transform: none; }
  to { transform: scale(15%); }
}

@keyframes outline {
  from { outline: 2px solid red; }
  to { outline: 2px solid orange; }
}

@keyframes slide {
  0% { transform: translateX(0); }
  100% { transform: translateX(500px); }
}

.slide {
  animation: slide 5s;
}

.attention {
  animation: pulse 1s infinite alternate;
}

@media (prefers-reduced-motion) {
  .slide {
    animation: slide linear(0, 0.1 50%, 0.9 50%, 1) 200ms;
  }
  .attention {
    animation: outline 1s infinite alternate;
  }
}
```

Animations defined within a media query which explicitly matches
`@media (prefers-reduced-motion)` are assumed to have been designed to reduce
motion and thus still allowed, while animations not defined within such a
media query would not. If some animations do not need to change, the author
could define them within a block matching both motion modes:

```css
@media (prefers-reduced-motion),
@media (prefers-reduced-motion: no-preference) {
  .attention {
    animation: outline 1s infinite alternate;
  }
}
```

### Web animations

Since web animations are not defined in CSS, they need a separate mechanism if
we wish to detect explicit support for reduced motion. We would extend the
[KeyframeAnimationOptions](https://www.w3.org/TR/web-animations-1/#dictdef-keyframeanimationoptions)
dictionary with a property annotating this support:

```
enum ReduceMotionSupport = {"normal", "reduced"};

dictionary KeyframeAnimationOptions : KeyframeEffectOptions {
    DOMString id = "";
    AnimationTimeline? timeline;
    ReduceMotionSupport motion = "normal";
};
```

Then, any animation started with `motion: reduced` would be assumed to have
reduced motion.

## Possible implementations

The user agent may reduce motion through a variety of means, but in the case of
scroll linked animations should preserve access to intermediate positions as
these may be essential for using the site.

For example, a user agent could apply one or more of the following strategies:

1. Make animations zero duration.

   Animations would complete instantly. For scroll
   linked animations, this may introduce issues if the animated value is
   necessary to use the site. As such, it's recommended that a different
   strategy be applied if the animation is scroll linked. This strategy may also
   break websites that rely on animations taking some amount of time.

2. Disable smooth interpolation.

   All (or just motion inducing animation properties) could be treated as
   [animation
   type](https://www.w3.org/TR/web-animations-1/#animating-properties)
   [discrete](https://www.w3.org/TR/web-animations-1/#discrete). This would
   result in those properties jumping between keyframes, removing the continuous
   motion while still presenting the author provided positions.

3. Present some subset of animation steps.

   Similar to the above strategy, some number of steps of the animation would be
   presented. However, the user agent could further limit the maximum number of
   steps. For example, at most 1 step per second or per scrolled distance may be
   presented and the rest could be skipped.
