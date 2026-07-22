# -*- coding: utf-8 -*-
"""Antenna Tracker Project Dashboard — Cloud-compatible backend"""
import json
import os
import subprocess
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Data sources — configurable via env vars
PAGES_URL = os.environ.get("PAGES_URL", "https://heaplore.github.io/antenna-tracker-shared")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "Heaplore/antenna-tracker-shared")
PORT = int(os.environ.get("PORT", "8799"))

def fetch_json(url):
    """Fetch JSON from a URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AntennaDashboard/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return None

def run_git(args):
    try:
        r = subprocess.run(["git"] + args, cwd=os.environ.get("WORK_DIR", "."), capture_output=True, text=True, timeout=30)
        return r.stdout.strip()
    except Exception as e:
        return f"Error: {e}"

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)

        if path == "/":
            html_path = os.path.join(os.path.dirname(__file__), "frontend", "index.html")
            if os.path.exists(html_path):
                with open(html_path, "r", encoding="utf-8") as f:
                    content = f.read().encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self._json({"error": "not found"}, 404)
            return

        if path == "/api/git/status":
            # Try local git first, fallback to GitHub API
            branch = run_git(["branch", "--show-current"])
            if not branch:
                # Fallback: GitHub API
                data = fetch_json(f"https://api.github.com/repos/{GITHUB_REPO}/branches/main")
                if data:
                    branch = data.get("name", "unknown")
                else:
                    branch = "unknown"
            
            ahead = run_git(["rev-list", "--count", "origin/main..HEAD"])
            behind = run_git(["rev-list", "--count", "HEAD..origin/main"])
            latest = run_git(["log", "-1", "--format=%h %s"])
            
            if not latest:
                # Fallback: GitHub API for latest commit
                data = fetch_json(f"https://api.github.com/repos/{GITHUB_REPO}/commits/main")
                if data:
                    sha = data.get("sha", "")[:8]
                    msg = data.get("commit", {}).get("message", "").split("\n")[0]
                    latest = f"{sha} {msg}"
            
            self._json({
                "branch": branch,
                "ahead_by": int(ahead) if ahead.isdigit() else 0,
                "behind_by": int(behind) if behind.isdigit() else 0,
                "latest_commit": latest,
            })
            return

        if path == "/api/data/freshness":
            freshness = {}
            urls = [
                ("prices", f"{PAGES_URL}/app/_data/prices.json"),
                ("knowledge_graph", f"{PAGES_URL}/app/_data/knowledge-graph.json"),
                ("news", f"{PAGES_URL}/app/_data/news.json"),
            ]
            for name, url in urls:
                d = fetch_json(url)
                if d is None:
                    continue
                
                size = len(json.dumps(d).encode("utf-8"))
                info = {"path": f"app/_data/{name}.json", "size": size, "last_check": datetime.now().isoformat()}
                
                if name == "prices":
                    cats = d.get("categories", []) if isinstance(d, dict) else []
                    info["categories"] = len(cats)
                    if isinstance(cats, list):
                        info["materials"] = sum(len(c.get("materials", [])) for c in cats)
                elif name == "knowledge_graph":
                    info["size_mb"] = round(size / 1024 / 1024, 2)
                elif name == "news":
                    items = d if isinstance(d, list) else d.get("items", [])
                    info["items"] = len(items)
                
                freshness[name] = info
            
            self._json(freshness)
            return

        if path == "/api/actions/runs":
            limit = int(qs.get("limit", ["5"])[0])
            try:
                data = fetch_json(f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page={limit}")
                runs = []
                if isinstance(data, dict):
                    for r in data.get("workflow_runs", []):
                        runs.append({
                            "name": r.get("name", ""),
                            "conclusion": r.get("conclusion", ""),
                            "created_at": r.get("created_at", ""),
                        })
                self._json({"runs": runs, "count": len(runs)})
            except Exception as e:
                self._json({"error": str(e), "runs": []})
            return

        if path == "/api/tasks":
            # Read from remote JSON on Pages if available
            tasks_url = f"{PAGES_URL}/tasks.json"
            tasks_data = fetch_json(tasks_url)
            tasks = tasks_data.get("tasks", []) if isinstance(tasks_data, dict) else []
            self._json({"tasks": tasks})
            return

        if path == "/api/logs":
            logs_url = f"{PAGES_URL}/logs.json"
            limit = int(qs.get("limit", ["20"])[0])
            logs_data = fetch_json(logs_url)
            logs = logs_data.get("logs", []) if isinstance(logs_data, dict) else []
            self._json({"logs": logs[-limit:], "total": len(logs)})
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/api/tasks":
            body = self._body()
            task = {
                "id": f"T{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "title": body.get("title", ""),
                "assignee": body.get("assignee", ""),
                "status": body.get("status", "todo"),
                "priority": body.get("priority", "medium"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            # Write to shared directory (local mode) or return for remote sync
            shared_dir = os.environ.get("SHARED_DIR", r"E:\shared\antenna-tracker")
            p = os.path.join(shared_dir, "tasks.json")
            tasks = []
            if os.path.exists(p):
                data = fetch_json(f"{PAGES_URL}/tasks.json")
                tasks = data.get("tasks", []) if isinstance(data, dict) else []
            tasks.append(task)
            with open(p, "w", encoding="utf-8") as f:
                json.dump({"tasks": tasks}, f, ensure_ascii=False, indent=2)
            self._json({"task": task, "status": "created"})
            return

        if path == "/api/logs":
            body = self._body()
            log_entry = {
                "id": f"L{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "agent": body.get("agent", ""),
                "action": body.get("action", ""),
                "detail": body.get("detail", ""),
                "timestamp": datetime.now().isoformat(),
            }
            shared_dir = os.environ.get("SHARED_DIR", r"E:\shared\antenna-tracker")
            p = os.path.join(shared_dir, "logs.json")
            logs = []
            if os.path.exists(p):
                data = fetch_json(f"{PAGES_URL}/logs.json")
                logs = data.get("logs", []) if isinstance(data, dict) else []
            logs.append(log_entry)
            logs = logs[-100:]
            with open(p, "w", encoding="utf-8") as f:
                json.dump({"logs": logs}, f, ensure_ascii=False, indent=2)
            self._json({"log": log_entry, "status": "logged"})
            return

        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path.startswith("/api/tasks/"):
            parts = path.split("/")
            task_id = parts[-1] if len(parts) >= 4 else ""
            body = self._body()
            status = body.get("status", "")
            
            shared_dir = os.environ.get("SHARED_DIR", r"E:\shared\antenna-tracker")
            p = os.path.join(shared_dir, "tasks.json")
            if not os.path.exists(p):
                self._json({"error": "not found"}, 404)
                return
            
            data = fetch_json(f"{PAGES_URL}/tasks.json")
            tasks = data.get("tasks", []) if isinstance(data, dict) else []
            for t in tasks:
                if t.get("id") == task_id:
                    t["status"] = status
                    t["updated_at"] = datetime.now().isoformat()
                    break
            
            with open(p, "w", encoding="utf-8") as f:
                json.dump({"tasks": tasks}, f, ensure_ascii=False, indent=2)
            self._json({"task": next((t for t in tasks if t.get("id") == task_id), {}), "status": "updated"})
            return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Antenna Tracker Dashboard running on http://0.0.0.0:{PORT}")
    print(f"  PAGES_URL={PAGES_URL}")
    print(f"  GITHUB_REPO={GITHUB_REPO}")
    default_dir = os.environ.get("SHARED_DIR", r"E:\shared\antenna-tracker")
    print(f"  SHARED_DIR={default_dir}")
    server.serve_forever()
