# Reduce motion

## Summary

The [prefers-reduced-motion CSS media
feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
can be used to detect if the user has requested that the system minimize non-essential motion.
However, it is currently up to sites to use this query to reduce the amount of
motion they exhibit.

With the introduction of scroll timeline, there is a risk that full screen
parallax animation effects may trigger issues
[#5321](https://github.com/w3c/csswg-drafts/issues/5321). In order to mitigate
this risk, in a similar manner to [auto dark
theme](https://developer.chrome.com/blog/auto-dark-theme/) the user agent could
intervene on sites which are not known to explicitly reduce their motion levels.

The proposal is that if the user has requested reduced motion and the site does
not declare that it supports reduced motion, then the browser will forcibly
reduce the amount of motion introduced by animations.

## Supporting reduced motion

If the site supports reduced motion, they would add this to their page:

```html
<meta name="supports-reduce-motion" content="reduce">
```

The reduce keyword corresponds to supporting the reduce value of the
[prefers-reduced-motion](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion) CSS media query.
Such a supporting site may provide alternate effects, e.g.

```html
@keyframes pulse {
  from { transform: none; }
  to { transform: scale(15%); }
}

.attention {
  animation: pulse 1s infinite alternate;
}

@keyframes outline {
  from { outline: 2px solid red; }
  to { outline: 2px solid orange; }
}

@media (prefers-reduced-motion) {
  .attention {
    animation: outline 1s infinite alternate;
  }

}
```

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
