#!/usr/bin/env sh
# Assemble the deployable site into _site/: the static pages plus the data
# contract and the docs they read. Used by Render and by GitHub Pages.
set -e
cd "$(dirname "$0")/.."

python3 pipeline/make_snapshot.py || echo "snapshot skipped"

rm -rf _site
mkdir -p _site
cp -R site/. _site/
rm -rf _site/data _site/docs          # strip local symlinks
cp -R data _site/data
cp -R docs _site/docs
printf 'User-agent: *\nAllow: /\n' > _site/robots.txt

# Stamp local css/js links with a content hash so browsers cannot serve a stale
# stylesheet after a deploy. Only _site is touched; the working tree stays clean.
python3 - <<'PY'
import hashlib, pathlib, re

site = pathlib.Path("_site")
assets = sorted(p for p in site.rglob("*") if p.suffix in (".css", ".js") and p.is_file())
digest = hashlib.sha1()
for a in assets:
    digest.update(a.read_bytes())
ver = digest.hexdigest()[:8]

pattern = re.compile(r'(href|src)="((?:css|js)/[^"?#]+\.(?:css|js))"')
for page in site.glob("*.html"):
    text = page.read_text(encoding="utf-8")
    stamped = pattern.sub(lambda m: f'{m.group(1)}="{m.group(2)}?v={ver}"', text)
    if stamped != text:
        page.write_text(stamped, encoding="utf-8")
print(f"stamped {len(assets)} assets as v={ver}")
PY

echo "built _site: $(du -sh _site | cut -f1)"
