#!/usr/bin/env python3
# Usage:
#   python3 docs/prune_snapshots.py --days 14 --min 2 --dir docs/data --dry-run

import argparse, json, shutil
from pathlib import Path
from datetime import datetime, timedelta, timezone

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=14, help="Keep snapshots newer than this many days")
    p.add_argument("--min", dest="min_keep", type=int, default=2, help="Always keep at least this many (newest-first)")
    p.add_argument("--dir", default="docs/data", help="Directory containing player JSON files")
    p.add_argument("--dry-run", action="store_true", help="Show what would change without writing files")
    return p.parse_args()

def parse_ts(ts: str) -> float:
    """Return epoch seconds; invalid -> -inf so it only survives via min_keep."""
    if not ts:
        return float("-inf")
    s = str(ts)
    try:
        # Handle 'Z' suffix
        if s.endswith("Z"):
            s = s.replace("Z", "+00:00")
        return datetime.fromisoformat(s).timestamp()
    except Exception:
        try:
            # Fallback common format: 2025-11-19T12:34:56
            return datetime.strptime(str(ts), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc).timestamp()
        except Exception:
            return float("-inf")

def prune_file(path: Path, cutoff_epoch: float, min_keep: int, dry_run: bool):
    raw = path.read_text(encoding="utf-8")
    try:
        obj = json.loads(raw)
    except Exception:
        print(f"? Skip (invalid JSON): {path.name}")
        return

    snaps = list(obj.get("snapshots") or [])
    if len(snaps) <= min_keep:
        print(f"= {path.name}: {len(snaps)} ? MIN_KEEP ({min_keep}) ? no change")
        return

    # Sort newest ? oldest
    snaps.sort(key=lambda s: parse_ts(s.get("timestamp")), reverse=True)
    newest = snaps[0] if snaps else None

    # Keep recent
    recent = [s for s in snaps if parse_ts(s.get("timestamp")) >= cutoff_epoch]

    # Ensure at least min_keep (top up from newest-first)
    keep = recent
    if len(keep) < min_keep:
        topup = snaps[:min_keep]
        seen = {parse_ts(s.get("timestamp")) for s in keep}
        keep = [s for s in topup if parse_ts(s.get("timestamp")) not in seen] + keep
        keep.sort(key=lambda s: parse_ts(s.get("timestamp")), reverse=True)

    # Ensure the single newest is always kept (position will be sorted later)
    if newest and newest not in keep:
        keep.append(newest)

    # Deduplicate by timestamp
    seen_ts = set()
    dedup = []
    for s in keep:
        t = parse_ts(s.get("timestamp"))
        if t in seen_ts: 
            continue
        seen_ts.add(t)
        dedup.append(s)
    keep = dedup

    # Final order in file: oldest ? newest (newest at the bottom as expected by site)
    keep.sort(key=lambda s: parse_ts(s.get("timestamp")))

    removed = len(snaps) - len(keep)
    if removed <= 0:
        print(f"= {path.name}: 0 removed")
        return

    if dry_run:
        print(f"~ {path.name}: would remove {removed} (kept {len(keep)})")
        return

    # One-time .bak
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        shutil.copyfile(path, bak)

    obj["snapshots"] = keep
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(f"? {path.name}: removed {removed}, kept {len(keep)}")

def main():
    a = parse_args()
    data_dir = Path(a.dir)
    cutoff = datetime.now(timezone.utc) - timedelta(days=a.days)
    cutoff_epoch = cutoff.timestamp()

    if not data_dir.exists():
        print(f"(directory not found: {data_dir})")
        return

    files = sorted([p for p in data_dir.glob("*.json")])
    if not files:
        print(f"(no .json files found in {data_dir})")
        return

    print(f"Pruning snapshots older than {a.days} days (min keep = {a.min_keep}) in {data_dir}{' [DRY RUN]' if a.dry_run else ''}")
    for f in files:
        prune_file(f, cutoff_epoch, a.min_keep, a.dry_run)

if __name__ == "__main__":
    main()