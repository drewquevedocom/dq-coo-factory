#!/usr/bin/env bash
# DQ OS dashboard v8 installer.
# Replaces the 7 dq-*.css + 5 dq-*.js patch layers with one dq.css + one dq.js.
# Keeps jarvis.css, app.js, next-moves.js and dq-core.js untouched.
set -euo pipefail

UI=/data/jarvis-hermes-dashboard/ui
RAW=https://raw.githubusercontent.com/drewquevedocom/dq-coo-factory/main/dashboard/ui
CSS_SHA=40ccd4017e535c173c3ccdb68c8db93af34bc1e1e5dd949a95af7ded8107a37b
JS_SHA=e455edc45a6aafb21945acf5d11c565fb7d45abbdce5a51fa1b8fd46195576e1

cd "$UI"
STAMP=$(date +%Y%m%d-%H%M%S)
cp index.html "index.html.bak-$STAMP"
echo "backup: index.html.bak-$STAMP"

curl -fsSL "$RAW/dq.css" -o dq.css.new
curl -fsSL "$RAW/dq.js"  -o dq.js.new

got_css=$(sha256sum dq.css.new | cut -d' ' -f1)
got_js=$(sha256sum dq.js.new  | cut -d' ' -f1)
[ "$got_css" = "$CSS_SHA" ] || { echo "ABORT css sha mismatch: $got_css"; rm -f dq.css.new dq.js.new; exit 1; }
[ "$got_js"  = "$JS_SHA"  ] || { echo "ABORT js sha mismatch: $got_js";  rm -f dq.css.new dq.js.new; exit 1; }
echo "sha ok: css $got_css"
echo "sha ok: js  $got_js"

mv dq.css.new dq.css
mv dq.js.new  dq.js

python3 - <<'PY'
import io,re
p='/data/jarvis-hermes-dashboard/ui/index.html'
s=io.open(p,encoding='utf-8').read()

dead_css=['dq-gold.css','dq-theme.css','dq-biz.css','dq-biz2.css','dq-v5.css','dq-v6.css','dq-v7.css','dq.css']
dead_js =['dq-biz.js','dq-biz2.js','dq-v5.js','dq-v6.js','dq-v7.js','dq.js']
for f in dead_css:
    s=re.sub(r'[ \t]*<link[^>]*href="%s"[^>]*>\s*\n?'%re.escape(f),'',s)
for f in dead_js:
    s=re.sub(r'[ \t]*<script[^>]*src="%s"[^>]*>\s*</script>\s*\n?'%re.escape(f),'',s)

m=re.search(r'([ \t]*)<link[^>]*href="jarvis\.css"[^>]*>\n?',s)
assert m,'jarvis.css link not found'
s=s[:m.end()]+'%s<link rel="stylesheet" href="dq.css">\n'%m.group(1)+s[m.end():]

m=re.search(r'([ \t]*)<script[^>]*src="dq-core\.js"[^>]*></script>\n?',s)
assert m,'dq-core.js script not found'
s=s[:m.end()]+'%s<script src="dq.js"></script>\n'%m.group(1)+s[m.end():]

io.open(p,'w',encoding='utf-8').write(s)
print('index.html rewritten')
PY

echo "--- asset tags now ---"
grep -n 'link rel="stylesheet"\|script src' index.html
echo "--- sizes ---"
ls -la dq.css dq.js
