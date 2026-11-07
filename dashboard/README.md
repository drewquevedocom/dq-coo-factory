# DQ OS dashboard — UI layer

Static CSS/JS for the Jarvis dashboard at `/data/jarvis-hermes-dashboard/ui/`.
No credentials, no server code. Pull target so files don't have to be pasted
into the agent chat a kilobyte at a time.

## Current (clean build, Nov 7)

Two files replace the seven patch layers that preceded them:

    jarvis.css, dq.css
    app.js, next-moves.js, dq-core.js, dq.js

`dq.css` and `dq.js` supersede `dq-gold.css`, `dq-theme.css`, `dq-biz.css`,
`dq-biz2.css`, `dq-v5.css`, `dq-v6.css`, `dq-v7.css` and their matching
scripts. Remove those from `index.html` when installing these.

`dq.js` moves existing nodes rather than recreating them, so every `app.js`
listener and every id survives. It exits quietly if `.panel.control`,
`.panel.center` and `.panel.right` are not all present.
