#!/usr/bin/env python3
"""
Generate an RSS feed (feed.xml) from updates.html patchnote blocks.
Run from the repo root (where updates.html lives):

python scripts/generate_feed.py

This writes `feed.xml` next to `updates.html`.
"""
import re
import os
import sys
from html import unescape
from datetime import datetime
from email.utils import format_datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
UPDATES = os.path.join(ROOT, 'updates.html')
OUT = os.path.join(ROOT, 'feed.xml')

if not os.path.exists(UPDATES):
    print('updates.html not found at', UPDATES)
    sys.exit(1)

with open(UPDATES, 'r', encoding='utf-8') as f:
    html = f.read()

# Split on patch blocks
blocks = re.split(r'(?=<div[^>]*class="patch terminal-patch)', html)
items = []
for b in blocks:
    if 'class="patch terminal-patch' not in b:
        continue
    block = b
    # version
    m = re.search(r'<strong>\[(.*?)\]</strong>', block)
    version = m.group(1).strip() if m else 'unknown'
    # date/meta
    m2 = re.search(r'<span class="meta">(.*?)<', block)
    meta = None
    if m2:
        meta = m2.group(1).strip()
    else:
        m2b = re.search(r'<span class="meta">(.*?)</span>', block)
        meta = m2b.group(1).strip() if m2b else None
    # collect list items in the patch body
    lis = re.findall(r'<li>(.*?)</li>', block, flags=re.DOTALL)
    lis = [unescape(re.sub(r'<[^>]+>', '', li)).strip() for li in lis]
    description = '\n'.join(f"- {li}" for li in lis) if lis else ''
    # try to extract an explicit id on the patch block (e.g. id="patch-00.10.02")
    m_id = re.search(r'id=["\']([^"\']+)["\']', block)
    anchor = m_id.group(1).strip() if m_id else f'patch-{version}'
    items.append({'version': version, 'meta': meta, 'description': description, 'anchor': anchor})

# Build RSS feed
site_title = 'maroon-series.art - Patch Notes'
site_link = 'https://maroon-series.art/'
site_desc = 'Patch notes for Mar00n series site.'
now = datetime.utcnow()

rss_items = []
for it in items:
    title = f"{it['version']}"
    # attempt to parse date formats like YYYY.MM.DD or YYYY-MM-DD
    pubdate = None
    if it['meta']:
        s = it['meta'].strip()
        for fmt in ('%Y.%m.%d', '%Y-%m-%d', '%Y.%m.%d %H:%M', '%Y'):
            try:
                dt = datetime.strptime(s, fmt)
                pubdate = format_datetime(dt)
                break
            except Exception:
                pubdate = None
    if not pubdate:
        pubdate = format_datetime(now)
    desc = it['description'] or 'Patch release.'
    # build anchor link to the specific patch block when possible
    anchor = it.get('anchor')
    link = site_link + 'updates.html' + (f'#{anchor}' if anchor else '')
    guid = link
    rss_items.append({'title': title, 'link': link, 'guid': guid, 'pubDate': pubdate, 'description': desc})

# Write feed.xml (RSS 2.0)
parts = []
parts.append('<?xml version="1.0" encoding="utf-8"?>')
parts.append('<rss version="2.0">')
parts.append('<channel>')
parts.append(f'<title>{site_title}</title>')
parts.append(f'<link>{site_link}</link>')
parts.append(f'<description>{site_desc}</description>')
parts.append(f'<lastBuildDate>{format_datetime(now)}</lastBuildDate>')
for i in rss_items:
    parts.append('<item>')
    parts.append(f'<title>{i["title"]}</title>')
    parts.append(f'<link>{i["link"]}</link>')
    parts.append(f'<guid>{i["guid"]}</guid>')
    parts.append(f'<pubDate>{i["pubDate"]}</pubDate>')
    parts.append(f'<description><![CDATA[{i["description"]}]]></description>')
    parts.append('</item>')
parts.append('</channel>')
parts.append('</rss>')

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(parts))

print('Wrote', OUT)
