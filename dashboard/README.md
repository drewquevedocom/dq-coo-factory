# DQ OS dashboard — UI layer

Static CSS/JS for the Jarvis dashboard at `/data/jarvis-hermes-dashboard/ui/`.
No credentials, no server code. Pull target so files don't have to be pasted
into the agent chat a kilobyte at a time.

Load order matters:

    jarvis.css, dq-gold.css, dq-theme.css, dq-biz.css, dq-biz2.css, dq-v5.css
    app.js, next-moves.js, dq-core.js, dq-biz.js, dq-biz2.js, dq-v5.js

`dq-v5.js` is additive. It reads `.dqwrap` built by `dq-biz.js` and exits
quietly if that is absent, so a partial install degrades instead of breaking.
