#!/usr/bin/env python3
"""
Incremental import for antenna-tracker knowledge graph.

Reads:  data/entities.csv, data/relations.csv (or --input-dir)
Writes: app/_data/knowledge-graph.json

Features:
    - Append-only (never deletes existing nodes/edges)
    - Deduplication by (source, target, relation) for relations
    - Type whitelist (company, technology, standard, material, event)
    - ID reference integrity check (relations must reference existing entities)
    - Confidence normalization (0.0 ~ 1.0)
    - --dry-run: preview changes without writing
    - Idempotent: re-running with same input produces no further changes

Usage:
    python kg_import.py [--input-dir <path>] [--kg-path <path>] [--dry-run]
"""

import argparse
import csv
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

BEIJING_TZ = timezone(timedelta(hours=8))
ALLOWED_ENTITY_TYPES = {"company", "technology", "standard", "material", "event"}
REQUIRED_ENTITY_COLS = ["id", "type", "name", "description"]
REQUIRED_RELATION_COLS = ["source", "target", "relation"]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Import CSV → knowledge-graph.json")
    p.add_argument("--input-dir", type=Path, default=None,
                   help="Directory containing entities.csv and relations.csv")
    p.add_argument("--kg-path", type=Path, default=None,
                   help="Path to knowledge-graph.json (auto-detected if omitted)")
    p.add_argument("--dry-run", action="store_true",
                   help="Preview changes without modifying the JSON file")
    p.add_argument("--strict", action="store_true",
                   help="Fail if any validation error (default: warn and skip)")
    return p.parse_args()


def auto_detect_paths(script_dir: Path) -> Tuple[Path, Path]:
    repo_root = script_dir.parent
    default_input = repo_root / "data"
    default_kg = repo_root / "app" / "_data" / "knowledge-graph.json"
    return default_input, default_kg


def load_knowledge_graph(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {
            "lastUpdate": "",
            "version": "1.0",
            "description": "",
            "entities": [],
            "relations": [],
        }
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_csv(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def _normalize_confidence(raw: str) -> float:
    raw = (raw or "").strip()
    if not raw:
        return 0.5
    try:
        value = float(raw)
    except ValueError:
        return 0.5
    if value > 1.0:
        value = value / 100.0 if value <= 100 else 1.0
    return max(0.0, min(1.0, value))


def _entity_key(entity: Dict[str, Any]) -> str:
    return (entity.get("id") or "").strip()


def _relation_key(relation: Dict[str, Any]) -> Tuple[str, str, str]:
    return (
        (relation.get("source") or "").strip(),
        (relation.get("target") or "").strip(),
        (relation.get("relation") or "").strip(),
    )


def _build_metadata(row: Dict[str, str], allowed_cols: Set[str]) -> Dict[str, Any]:
    md: Dict[str, Any] = {}
    skip = set(REQUIRED_ENTITY_COLS) | {"source_sectors"}
    for k, v in row.items():
        if k in skip or not k:
            continue
        if k not in allowed_cols and allowed_cols:
            continue
        if v is None:
            continue
        v = v.strip()
        if v:
            md[k] = v
    return md


def parse_entity_row(row: Dict[str, str]) -> Dict[str, Any]:
    eid = (row.get("id") or "").strip()
    etype = (row.get("type") or "").strip()
    if not eid:
        raise ValueError(f"Entity missing id: {row}")
    if etype not in ALLOWED_ENTITY_TYPES:
        raise ValueError(f"Entity {eid}: invalid type '{etype}'. Allowed: {sorted(ALLOWED_ENTITY_TYPES)}")

    entity: Dict[str, Any] = {
        "id": eid,
        "type": etype,
        "name": (row.get("name") or "").strip(),
        "description": (row.get("description") or "").strip(),
    }
    sectors_raw = (row.get("source_sectors") or "").strip()
    if sectors_raw:
        entity["source_sectors"] = [s.strip() for s in sectors_raw.split(";") if s.strip()]
    else:
        entity["source_sectors"] = []

    md = _build_metadata(row, allowed_cols={"stock_code", "location", "is_key"})
    if md:
        entity["metadata"] = md
    else:
        entity["metadata"] = {}

    return entity


def parse_relation_row(row: Dict[str, str]) -> Dict[str, Any]:
    for col in REQUIRED_RELATION_COLS:
        if not (row.get(col) or "").strip():
            raise ValueError(f"Relation missing '{col}': {row}")
    rel = {
        "source": (row.get("source") or "").strip(),
        "target": (row.get("target") or "").strip(),
        "relation": (row.get("relation") or "").strip(),
        "confidence": _normalize_confidence(row.get("confidence", "")),
    }
    evidence = (row.get("evidence") or "").strip()
    if evidence:
        rel["evidence"] = evidence
    return rel


def merge(kg: Dict[str, Any], new_entities: List[Dict[str, Any]],
          new_relations: List[Dict[str, Any]], strict: bool = False) -> Dict[str, Any]:
    existing_entity_ids: Set[str] = {_entity_key(e) for e in kg.get("entities", [])}
    existing_entity_keys: Set[str] = existing_entity_ids

    entity_dupes: List[str] = []
    relation_dupes: List[Tuple[str, str, str]] = []
    invalid_refs: List[Tuple[str, str]] = []
    added_entities: List[str] = []
    added_relations: List[Tuple[str, str, str]] = []

    for ent in new_entities:
        eid = _entity_key(ent)
        if eid in existing_entity_keys:
            entity_dupes.append(eid)
            continue
        kg["entities"].append(ent)
        existing_entity_keys.add(eid)
        added_entities.append(eid)

    all_known_ids = existing_entity_keys

    existing_relation_keys: Set[Tuple[str, str, str]] = {
        _relation_key(r) for r in kg.get("relations", [])
    }

    for rel in new_relations:
        key = _relation_key(rel)
        if key in existing_relation_keys:
            relation_dupes.append(key)
            continue
        if rel["source"] not in all_known_ids or rel["target"] not in all_known_ids:
            invalid_refs.append((rel["source"], rel["target"]))
            if strict:
                raise ValueError(f"Relation references unknown entity: {key}")
            continue
        kg["relations"].append(rel)
        existing_relation_keys.add(key)
        added_relations.append(key)

    return {
        "added_entities": added_entities,
        "added_relations": added_relations,
        "entity_dupes": entity_dupes,
        "relation_dupes": relation_dupes,
        "invalid_refs": invalid_refs,
    }


def render_report(stats: Dict[str, Any], dry_run: bool) -> str:
    lines = [
        f"{'DRY RUN' if dry_run else 'APPLIED'} summary",
        "-" * 40,
        f"Entities added:    {len(stats['added_entities'])}",
        f"Entities dup:      {len(stats['entity_dupes'])}",
        f"Relations added:   {len(stats['added_relations'])}",
        f"Relations dup:     {len(stats['relation_dupes'])}",
        f"Invalid refs:      {len(stats['invalid_refs'])}",
        "",
    ]
    if stats["added_entities"]:
        lines.append("New entities:")
        for eid in stats["added_entities"]:
            lines.append(f"  + {eid}")
    if stats["added_relations"]:
        lines.append("New relations:")
        for s, t, r in stats["added_relations"]:
            lines.append(f"  + {s} --[{r}]--> {t}")
    if stats["entity_dupes"]:
        lines.append(f"Skipped entity dupes ({len(stats['entity_dupes'])}): {', '.join(stats['entity_dupes'][:5])}"
                     + ("..." if len(stats["entity_dupes"]) > 5 else ""))
    if stats["relation_dupes"]:
        lines.append(f"Skipped relation dupes ({len(stats['relation_dupes'])})")
    if stats["invalid_refs"]:
        lines.append("Invalid references (skipped):")
        for s, t in stats["invalid_refs"]:
            lines.append(f"  ! {s} -> {t}")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    default_input, default_kg = auto_detect_paths(script_dir)

    input_dir = args.input_dir or default_input
    kg_path = args.kg_path or default_kg

    if not input_dir.exists():
        print(f"ERROR: input dir not found: {input_dir}", file=sys.stderr)
        print(f"Create {input_dir}/entities.csv and {input_dir}/relations.csv first.",
              file=sys.stderr)
        return 1

    entities_csv = input_dir / "entities.csv"
    relations_csv = input_dir / "relations.csv"

    if not entities_csv.exists() and not relations_csv.exists():
        print(f"ERROR: no CSV files in {input_dir}", file=sys.stderr)
        return 1

    entity_rows = read_csv(entities_csv)
    relation_rows = read_csv(relations_csv)

    try:
        new_entities = [parse_entity_row(r) for r in entity_rows]
    except ValueError as e:
        print(f"ERROR parsing entities: {e}", file=sys.stderr)
        return 2
    try:
        new_relations = [parse_relation_row(r) for r in relation_rows]
    except ValueError as e:
        print(f"ERROR parsing relations: {e}", file=sys.stderr)
        return 2

    kg = load_knowledge_graph(kg_path)
    original_entity_count = len(kg.get("entities", []))
    original_relation_count = len(kg.get("relations", []))

    stats = merge(kg, new_entities, new_relations, strict=args.strict)

    new_entity_count = len(kg["entities"])
    new_relation_count = len(kg["relations"])

    print(render_report(stats, dry_run=args.dry_run))
    print(f"\nKG before: {original_entity_count} entities, {original_relation_count} relations")
    print(f"KG after:  {new_entity_count} entities, {new_relation_count} relations")

    if args.dry_run:
        print("\n(dry-run: no changes written)")
        return 0

    kg["lastUpdate"] = datetime.now(tz=BEIJING_TZ).strftime("%Y-%m-%d")
    kg_path.parent.mkdir(parents=True, exist_ok=True)
    with kg_path.open("w", encoding="utf-8") as f:
        json.dump(kg, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"\n✓ Wrote: {kg_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())