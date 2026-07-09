#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate a GitLab weekly raw Markdown report.

Usage:

  export GITLAB_URL="http://gitlab.intchains.in:9000"
  export GITLAB_TOKEN="your_token"
  export GITLAB_USERNAME="yunhao.gu"

  # Optional: limit commit scan to specific projects
  export GITLAB_PROJECT_IDS="123,456,789"

  python3 gitlab_weekly_md.py --days 7
  python3 gitlab_weekly_md.py --since 2026-06-29 --until 2026-07-03
"""

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from collections import defaultdict

import requests


def parse_args():
    parser = argparse.ArgumentParser(description="Generate GitLab weekly Markdown report.")

    parser.add_argument(
        "--gitlab-url",
        default=os.getenv("GITLAB_URL", "http://gitlab.intchains.in:9000"),
        help="GitLab base URL, for example http://gitlab.intchains.in:9000",
    )

    parser.add_argument(
        "--token",
        default=os.getenv("GITLAB_TOKEN"),
        help="GitLab Personal Access Token. You can also set GITLAB_TOKEN.",
    )

    parser.add_argument(
        "--username",
        default=os.getenv("GITLAB_USERNAME", "yunhao.gu"),
        help="GitLab username, for example yunhao.gu",
    )

    parser.add_argument(
        "--project-ids",
        default=os.getenv("GITLAB_PROJECT_IDS", ""),
        help="Comma separated GitLab project IDs. Optional.",
    )

    parser.add_argument(
        "--since",
        default=None,
        help="Start date or datetime, for example 2026-06-29 or 2026-06-29T00:00:00Z",
    )

    parser.add_argument(
        "--until",
        default=None,
        help="End date or datetime, for example 2026-07-03 or 2026-07-03T23:59:59Z",
    )

    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="If --since is not set, scan recent N days. Default: 7.",
    )

    parser.add_argument(
        "--output",
        default="weekly_gitlab_report.md",
        help="Output Markdown file.",
    )

    parser.add_argument(
        "--timezone",
        default=os.getenv("GITLAB_TIMEZONE", ""),
        help="Timezone for display, e.g., 'Beijing', 'Asia/Shanghai', 'UTC+8'. Default: auto-detect from GitLab.",
    )

    parser.add_argument(
        "--max-projects",
        type=int,
        default=80,
        help="Max projects to auto scan when GITLAB_PROJECT_IDS is not set.",
    )

    return parser.parse_args()


def parse_datetime(value, is_end=False):
    if not value:
        return None

    # Date only: 2026-07-03
    if "T" not in value:
        if is_end:
            value = value + "T23:59:59+00:00"
        else:
            value = value + "T00:00:00+00:00"

    value = value.replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def to_gitlab_time(dt):
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def to_gitlab_date(dt):
    return dt.astimezone(timezone.utc).date().isoformat()


def format_local_time(iso_time_str, tz_offset_hours=0):
    """Convert ISO time string to local time with offset.

    Args:
        iso_time_str: ISO format time string (e.g., "2026-07-05T03:13:12Z")
        tz_offset_hours: Timezone offset in hours (e.g., 8 for UTC+8)

    Returns:
        Formatted local time string, or original string if parsing fails
    """
    if not iso_time_str or iso_time_str == "None":
        return iso_time_str

    try:
        # Parse ISO format time
        dt = datetime.fromisoformat(iso_time_str.replace("Z", "+00:00"))
        # Apply timezone offset
        local_dt = dt + timedelta(hours=tz_offset_hours)
        # Format as readable string
        return local_dt.strftime("%Y-%m-%d %H:%M:%S") + f" (UTC+{tz_offset_hours})"
    except Exception:
        return iso_time_str


def parse_timezone_offset(timezone_str):
    """Parse GitLab timezone string to numeric UTC offset in hours.

    GitLab returns timezone as IANA timezone names (e.g., "Asia/Shanghai")
    or sometimes as abbreviations. This function converts common ones to offsets.

    Args:
        timezone_str: Timezone string from GitLab API or command line

    Returns:
        Numeric UTC offset in hours (e.g., 8 for UTC+8), defaults to 0
    """
    if not timezone_str:
        return 0

    # Common timezone mappings (IANA names and abbreviations)
    tz_map = {
        # Asia
        "Beijing": 8,
        "Asia/Shanghai": 8,
        "Asia/Chongqing": 8,
        "Asia/Hong_Kong": 8,
        "Asia/Taipei": 8,
        "Asia/Singapore": 8,
        "Asia/Tokyo": 9,
        "Asia/Seoul": 9,
        "Asia/Kolkata": 5.5,
        "Asia/Dubai": 4,
        # Europe
        "Europe/London": 0,
        "Europe/Paris": 1,
        "Europe/Berlin": 1,
        "Europe/Moscow": 3,
        # Americas
        "America/New_York": -5,
        "America/Chicago": -6,
        "America/Denver": -7,
        "America/Los_Angeles": -8,
        "America/Sao_Paulo": -3,
        # Pacific
        "Pacific/Auckland": 12,
        "Australia/Sydney": 10,
        # Common abbreviations
        "CST": 8,  # China Standard Time
        "JST": 9,  # Japan Standard Time
        "EST": -5,  # Eastern Standard Time
        "PST": -8,  # Pacific Standard Time
        "UTC": 0,
        "GMT": 0,
    }

    # Try direct lookup (case-insensitive)
    tz_lower = timezone_str.lower()
    for key, value in tz_map.items():
        if key.lower() == tz_lower:
            return value

    # Try to parse offset format like "UTC+8" or "+08:00"
    if "+" in timezone_str or (timezone_str.count("-") > 0 and ":" in timezone_str):
        try:
            # Handle formats like "UTC+8", "+08:00", "-05:00"
            parts = timezone_str.replace("UTC", "").split(":")
            hours = int(parts[0])
            minutes = int(parts[1]) if len(parts) > 1 else 0
            return hours + (minutes / 60.0 if hours >= 0 else -minutes / 60.0)
        except Exception:
            pass

    # Default to UTC
    print(f"[WARN] Unknown timezone '{timezone_str}', defaulting to UTC", file=sys.stderr)
    return 0


def infer_timezone_from_location(location):
    """Infer timezone from user's location field.

    Args:
        location: Location string from GitLab user profile

    Returns:
        Timezone string or None if cannot infer
    """
    if not location:
        return None

    location_lower = location.lower()

    # Common location patterns
    if any(keyword in location_lower for keyword in ["上海", "shanghai", "北京", "beijing", "中国", "china"]):
        return "Beijing"
    elif any(keyword in location_lower for keyword in ["东京", "tokyo", "日本", "japan"]):
        return "Asia/Tokyo"
    elif any(keyword in location_lower for keyword in ["new york", "纽约"]):
        return "America/New_York"

    return None



class GitLabClient:
    def __init__(self, base_url, token):
        self.base_url = base_url.rstrip("/")
        self.api_url = self.base_url + "/api/v4"
        self.session = requests.Session()
        self.session.headers.update({
            "PRIVATE-TOKEN": token,
            "Accept": "application/json",
        })

    def get(self, path, params=None, paginated=True):
        url = self.api_url + path
        params = dict(params or {})

        if paginated:
            params.setdefault("per_page", 100)
            params.setdefault("page", 1)

        results = []

        while True:
            resp = self.session.get(url, params=params, timeout=30)

            if resp.status_code == 401:
                raise RuntimeError("401 Unauthorized: token 无效，或者 token 权限不足。")

            if resp.status_code == 403:
                raise RuntimeError("403 Forbidden: token 没有权限访问该接口或项目。")

            if resp.status_code == 404:
                raise RuntimeError(f"404 Not Found: {url}")

            resp.raise_for_status()

            data = resp.json()

            if not paginated:
                return data

            if isinstance(data, list):
                results.extend(data)
            else:
                return data

            next_page = resp.headers.get("X-Next-Page")
            if not next_page:
                break

            params["page"] = next_page

        return results

    def get_current_user(self):
        return self.get("/user", paginated=False)

    def get_user_timezone(self):
        """Get the current user's timezone from GitLab settings."""
        user = self.get_current_user()
        return user.get("timezone", "UTC")

    def get_user_by_username(self, username):
        users = self.get("/users", params={"username": username}, paginated=True)
        if not users:
            raise RuntimeError(f"找不到 GitLab 用户：{username}")
        return users[0]

    def list_my_merge_requests(self, username, since, until):
        return self.get(
            "/merge_requests",
            params={
                "scope": "all",
                "author_username": username,
                "state": "all",
                "updated_after": to_gitlab_time(since),
                "updated_before": to_gitlab_time(until),
                "order_by": "updated_at",
                "sort": "desc",
            },
            paginated=True,
        )

    def list_mr_commits(self, project_id, mr_iid):
        return self.get(
            f"/projects/{project_id}/merge_requests/{mr_iid}/commits",
            paginated=True,
        )

    def list_active_member_projects(self, since, max_projects=80):
        projects = self.get(
            "/projects",
            params={
                "membership": True,
                "archived": False,
                "last_activity_after": to_gitlab_time(since),
                "order_by": "last_activity_at",
                "sort": "desc",
                "simple": True,
            },
            paginated=True,
        )
        return projects[:max_projects]

    def get_project(self, project_id):
        return self.get(f"/projects/{project_id}", paginated=False)

    def list_project_commits(self, project_id, since, until, author=None):
        params = {
            "since": to_gitlab_time(since),
            "until": to_gitlab_time(until),
            "with_stats": True,
        }

        if author:
            params["author"] = author

        return self.get(
            f"/projects/{project_id}/repository/commits",
            params=params,
            paginated=True,
        )


def normalize_project_ids(raw_project_ids):
    if not raw_project_ids:
        return []

    return [
        item.strip()
        for item in raw_project_ids.split(",")
        if item.strip()
    ]


def short_sha(sha):
    if not sha:
        return ""
    return sha[:8]


def safe_text(value):
    if value is None:
        return ""
    return str(value).replace("\n", " ").strip()


def collect_commit_author_candidates(user):
    candidates = set()

    for key in ["username", "name", "email", "public_email", "commit_email"]:
        value = user.get(key)
        if value:
            candidates.add(value)

    return sorted(candidates)


def dedupe_commits(commits):
    result = {}
    for c in commits:
        sha = c.get("id") or c.get("short_id")
        if sha:
            result[sha] = c
    return list(result.values())


def collect_project_commits(gl, project_ids, since, until, user):
    author_candidates = collect_commit_author_candidates(user)

    commits_by_project = defaultdict(list)
    project_meta = {}

    for project_id in project_ids:
        try:
            project = gl.get_project(project_id)
            project_meta[str(project_id)] = project
        except Exception as e:
            print(f"[WARN] Failed to get project {project_id}: {e}", file=sys.stderr)
            continue

        all_commits = []

        # 优先按 author 查询，减少数据量
        for author in author_candidates:
            try:
                commits = gl.list_project_commits(project_id, since, until, author=author)
                all_commits.extend(commits)
            except Exception as e:
                print(
                    f"[WARN] Failed to get commits in project {project_id} with author={author}: {e}",
                    file=sys.stderr,
                )

        commits_by_project[str(project_id)] = dedupe_commits(all_commits)

    return project_meta, commits_by_project


def render_markdown(user, since, until, mrs, mr_commits_map, project_meta, commits_by_project, tz_offset=0):
    lines = []

    lines.append("# GitLab Weekly Raw Report")
    lines.append("")
    lines.append("## 基本信息")
    lines.append("")
    lines.append(f"- 用户：{user.get('name', '')} (@{user.get('username', '')})")
    lines.append(f"- 时间范围：{format_local_time(to_gitlab_time(since), tz_offset)} ~ {format_local_time(to_gitlab_time(until), tz_offset)}")
    lines.append("")

    lines.append("## 1. 本周 Merge Requests")
    lines.append("")

    if not mrs:
        lines.append("本周没有抓取到 MR。")
        lines.append("")
    else:
        shown_any = False
        for mr in mrs:
            # Skip closed (abandoned) MRs
            if mr.get("state") == "closed":
                continue

            project_id = mr.get("project_id")
            iid = mr.get("iid")
            key = f"{project_id}!{iid}"
            ref = mr.get("references", {}).get("full", f"!{iid}")

            # Find the latest commit time in this MR
            commits = mr_commits_map.get(key, [])
            latest_commit_time = None
            if commits:
                commit_times = []
                for c in commits:
                    commit_time = c.get("committed_date") or c.get("created_at")
                    if commit_time:
                        commit_times.append(commit_time)
                if commit_times:
                    latest_commit_time = max(commit_times)

            # Filter out MRs whose latest commit is outside the time range
            # (e.g., MR was only reviewed/approved this week, but actual code was committed earlier)
            if latest_commit_time:
                try:
                    lct = datetime.fromisoformat(latest_commit_time.replace("Z", "+00:00"))
                    if lct < since or lct > until:
                        continue
                except Exception:
                    pass  # If parsing fails, show the MR anyway

            shown_any = True
            lines.append(f"### {ref} {safe_text(mr.get('title'))}")
            lines.append("")
            lines.append(f"- 项目 ID：`{project_id}`")
            lines.append(f"- 状态：`{mr.get('state')}`")
            lines.append(f"- 源分支：`{mr.get('source_branch')}`")
            lines.append(f"- 目标分支：`{mr.get('target_branch')}`")
            lines.append(f"- 创建时间：{format_local_time(mr.get('created_at'), tz_offset)}")
            if latest_commit_time:
                lines.append(f"- 最后提交时间：{format_local_time(latest_commit_time, tz_offset)}")
            lines.append(f"- 更新时间：{format_local_time(mr.get('updated_at'), tz_offset)}")
            if mr.get("merged_at"):
                lines.append(f"- 合并时间：{format_local_time(mr.get('merged_at'), tz_offset)}")
            lines.append("")

            description = mr.get("description")
            if description:
                description = str(description).strip()
                lines.append("MR 描述摘要：")
                lines.append("")
                for desc_line in description.splitlines():
                    lines.append(f"> {desc_line}")
                lines.append("")

            commits = mr_commits_map.get(key, [])
            lines.append("关联 Commits：")

            if not commits:
                lines.append("- 未抓取到 commit。")
            else:
                for c in commits:
                    lines.append(f"- `{short_sha(c.get('id'))}` {safe_text(c.get('title'))}")

            lines.append("")

        if not shown_any:
            lines.append("本周没有符合条件的 MR（所有 MR 的最后提交时间均不在本周范围内）。")
            lines.append("")

    lines.append("## 2. 本周 Direct Commits")
    lines.append("")
    lines.append("> 这部分来自项目级 Commits API，用于补充没有走 MR 的提交，或者 MR 查询没有覆盖到的提交。")
    lines.append("")

    if not commits_by_project:
        lines.append("没有配置项目 ID，也没有自动扫描到活跃项目。")
        lines.append("")
    else:
        any_commit = False

        for project_id, commits in commits_by_project.items():
            if not commits:
                continue

            any_commit = True
            project = project_meta.get(project_id, {})
            project_name = project.get("path_with_namespace") or project.get("name") or project_id

            lines.append(f"### {project_name}")
            lines.append("")

            for c in commits:
                stats = c.get("stats") or {}
                additions = stats.get("additions", "?")
                deletions = stats.get("deletions", "?")

                lines.append(f"- `{short_sha(c.get('id'))}` {safe_text(c.get('title'))}")
                lines.append(f"  - 作者：{safe_text(c.get('author_name'))} <{safe_text(c.get('author_email'))}>")
                lines.append(f"  - 时间：{c.get('created_at')}")
                lines.append(f"  - 改动：+{additions} / -{deletions}")
                lines.append(f"  - 链接：{c.get('web_url')}")

            lines.append("")

        if not any_commit:
            lines.append("本周没有抓取到 direct commit。")
            lines.append("")

    lines.append("## 3. 给 AI 的周报生成提示词")
    lines.append("")
    lines.append("请根据以上 GitLab 原始记录，生成一份中文周报。")
    lines.append("")
    lines.append("要求：")
    lines.append("")
    lines.append("1. 不要逐条翻译 commit，要归纳成工作事项。")
    lines.append("2. 语气适合发给上级，不要太口语化。")
    lines.append("3. 按「本周完成」「问题修复」「进行中」「下周计划」组织。")
    lines.append("4. 对嵌入式 Linux、SDK、镜像烧录、Debian 打包、GitLab workflow 等关键词保留必要技术信息。")
    lines.append("5. 如果某些 commit/MR 看不出业务意义，请归类为「代码维护 / 构建修复 / 流程优化」。")
    lines.append("6. 输出简洁版，不要写成日报。")
    lines.append("")

    return "\n".join(lines)


def main():
    args = parse_args()

    if not args.token:
        print("ERROR: 请设置 GITLAB_TOKEN，或者使用 --token 传入。", file=sys.stderr)
        sys.exit(1)

    until = parse_datetime(args.until, is_end=True)
    if until is None:
        until = datetime.now(timezone.utc)

    since = parse_datetime(args.since, is_end=False)
    if since is None:
        since = until - timedelta(days=args.days)

    gl = GitLabClient(args.gitlab_url, args.token)

    # 1. 验证 token，并拿当前 token 对应的用户
    current_user = gl.get_current_user()

    # 2. 如果指定 username，就按 username 查；否则用当前 token 用户
    if args.username:
        try:
            user = gl.get_user_by_username(args.username)
            # /users?username 返回的信息可能比 /user 少，所以合并一下
            if user.get("username") == current_user.get("username"):
                merged_user = dict(current_user)
                merged_user.update(user)
                user = merged_user
        except Exception as e:
            print(f"[WARN] 根据 username 查询用户失败，改用 /user 当前用户：{e}", file=sys.stderr)
            user = current_user
    else:
        user = current_user

    username = user.get("username") or args.username
    if not username:
        raise RuntimeError("无法确定 GitLab username。")

    # Get timezone: CLI arg > location inference > GitLab API > UTC
    if args.timezone:
        # User explicitly specified timezone via --timezone or GITLAB_TIMEZONE
        tz_str = args.timezone
        tz_source = "CLI argument"
    else:
        # Try to infer from location
        location = user.get("location", "")
        tz_str = infer_timezone_from_location(location)
        if tz_str:
            tz_source = f"inferred from location '{location}'"
        else:
            # Try GitLab API fields (older versions might have it)
            tz_str = (
                current_user.get("timezone") or
                current_user.get("time_zone") or
                user.get("timezone") or
                user.get("time_zone")
            )
            if tz_str:
                tz_source = "GitLab API"
            else:
                tz_str = "UTC"
                tz_source = "default"

    tz_offset = parse_timezone_offset(tz_str)

    print(f"[INFO] GitLab: {args.gitlab_url}")
    print(f"[INFO] User: {user.get('name')} (@{username})")
    print(f"[INFO] Timezone: {tz_str} (UTC{tz_offset:+g}) [{tz_source}]")
    print(f"[INFO] Range: {format_local_time(to_gitlab_time(since), tz_offset)} ~ {format_local_time(to_gitlab_time(until), tz_offset)}")

    # 3. 抓 MR
    print("[INFO] Fetching merge requests...")
    mrs = gl.list_my_merge_requests(username, since, until)

    # 4. 抓每个 MR 的 commits
    print("[INFO] Fetching MR commits...")
    mr_commits_map = {}

    for mr in mrs:
        project_id = mr.get("project_id")
        iid = mr.get("iid")
        key = f"{project_id}!{iid}"

        try:
            mr_commits_map[key] = gl.list_mr_commits(project_id, iid)
        except Exception as e:
            print(f"[WARN] Failed to get commits for MR {key}: {e}", file=sys.stderr)
            mr_commits_map[key] = []

    # 5. 决定扫描哪些项目的 direct commits
    project_ids = normalize_project_ids(args.project_ids)

    if project_ids:
        print(f"[INFO] Using configured project IDs: {project_ids}")
    else:
        print("[INFO] No project IDs configured. Auto scanning active member projects...")
        projects = gl.list_active_member_projects(since, max_projects=args.max_projects)
        project_ids = [str(p["id"]) for p in projects]
        print(f"[INFO] Auto selected {len(project_ids)} projects.")

    # 6. 抓项目级 commits
    print("[INFO] Fetching project commits...")
    project_meta, commits_by_project = collect_project_commits(
        gl=gl,
        project_ids=project_ids,
        since=since,
        until=until,
        user=user,
    )

    # 7. 输出 Markdown
    md = render_markdown(
        user=user,
        since=since,
        until=until,
        mrs=mrs,
        mr_commits_map=mr_commits_map,
        project_meta=project_meta,
        commits_by_project=commits_by_project,
        tz_offset=tz_offset,
    )

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"[OK] Generated: {args.output}")


if __name__ == "__main__":
    main()