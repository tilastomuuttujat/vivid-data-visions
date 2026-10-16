"""Refresh the reviewed TTT snapshot using a pinned Git commit (no live database).

Usage: python scripts/data/import-murros-network.py <40-character-commit-sha>
After import, review decision-network-model.ts mappings and run the network tests.
"""
import datetime
import hashlib
import json
from pathlib import Path
import re
import sys
import urllib.request


def convert(data, commit, raw):
    nodes = [{
        'id': n['id'], 'title': n['title'],
        'yearStart': n.get('year_start'), 'yearEnd': n.get('year_end'),
        'kind': n.get('type', ''), 'problem': n.get('problem', ''),
        'mechanism': n.get('mechanism', ''), 'longEffect': n.get('long_effect', ''),
        'sources': n.get('sources', []),
    } for n in data['items']]
    ids = {n['id'] for n in nodes}
    if len(ids) != len(nodes):
        raise ValueError('Duplicate node identifiers')
    edges = []
    for i, edge in enumerate(data['relations'], 1):
        if edge['from'] not in ids or edge['to'] not in ids:
            raise ValueError(f'Unknown relation endpoint: {edge}')
        edges.append({
            'id': f'ttt-r{i}', 'from': edge['from'], 'to': edge['to'],
            'type': edge['type'], 'relationClass': edge['rel_class'],
            'confidence': edge.get('confidence', 'ei määritelty'),
            'rationale': edge.get('rationale', ''),
        })
    blob_sha = hashlib.sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest()
    return {
        'schemaVersion': 1,
        'source': {
            'repository': 'tilastomuuttujat/TTT', 'path': 'atlas/murrosatlas.json',
            'commit': commit, 'blobSha': blob_sha,
            'retrieved': datetime.date.today().isoformat(),
            'url': f'https://github.com/tilastomuuttujat/TTT/blob/{commit}/atlas/murrosatlas.json',
            'status': data['meta']['status'],
        },
        'nodes': nodes, 'edges': edges,
    }


if __name__ == '__main__':
    if len(sys.argv) != 2 or not re.fullmatch(r'[0-9a-f]{40}', sys.argv[1]):
        raise SystemExit('Provide an explicit 40-character Git commit SHA.')
    commit = sys.argv[1]
    url = f'https://raw.githubusercontent.com/tilastomuuttujat/TTT/{commit}/atlas/murrosatlas.json'
    with urllib.request.urlopen(url, timeout=60) as response:
        raw = response.read()
    converted = convert(json.loads(raw), commit, raw)
    target = Path(__file__).resolve().parents[2] / 'src/data/murros-network.json'
    target.write_text(json.dumps(converted, ensure_ascii=False, indent=2) + '\n')
    print(f"Imported {len(converted['nodes'])} nodes and {len(converted['edges'])} relations")
