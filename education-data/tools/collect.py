"""Download the public NIER middle-school prefectural files; no imputation."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
import zipfile

BASE = Path(__file__).resolve().parents[1]
CACHE = BASE / '.source-cache'
CACHE.mkdir(exist_ok=True)

def get(url):
    return urllib.request.urlopen(url, timeout=60).read()

jobs = []
directories = []
for year in [2025, 2026]:
    base = f'https://www.nier.go.jp/{year % 100}chousakekkahoukoku/factsheet/'
    html = get(base + 'prefecture_city.html').decode('utf-8')
    regions = re.findall(r'href="([^\"]+/index.html)"[^>]*>\s*(\d{2})\s*([^<]+)', html)[:47]
    assert len(regions) == 47
    for path, code, name in regions:
        url = urllib.parse.urljoin(base, path)
        sub = get(url).decode('utf-8')
        for f in re.findall(r'href="([^\"]+\.xlsx)"', sub):
            if re.search(r'm_' + str(year % 100) + r'(?:r|rs|a)\.xlsx$', f):
                jobs.append((year, code, name, urllib.parse.urljoin(url, f)))
        if year == 2026:
            directories.append((code, name, url.split('/factsheet/')[1].split('/')[0]))
for code, name, directory in directories:
    for kind in ['r', 'a']:
        # WARP replay timestamp resolved from the archived NIER prefecture page.
        url = f'https://warp.da.ndl.go.jp/20251213/20251203143749/https://www.nier.go.jp/24chousakekkahoukoku/factsheet/{directory}/{code}m_24{kind}.xlsx'
        jobs.append((2024, code, name, url))

def download(job):
    year, code, name, url = job
    path = CACHE / f'{year}_{code}_{url.rsplit("/", 1)[1]}'
    if not path.exists():
        path.write_bytes(get(url))
    assert zipfile.is_zipfile(path), f'Not an XLSX: {url}'
    return dict(year=year, code=code, name=name, url=url, path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest())

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(download, jobs))
assert len(results) == 282
(CACHE / 'manifest.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(f'Downloaded {len(results)} official workbooks.')
