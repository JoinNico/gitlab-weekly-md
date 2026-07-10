// ==UserScript==
// @name         GitLab 周报助手
// @namespace    https://github.com/JoinNico/gitlab-weekly-md
// @version      0.1.0
// @description  在 GitLab 页面中一键生成周报 Markdown 原始材料
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================================
  // 1. CSS_STYLES
  // =========================================================================

  const CSS_STYLES = `
    /* Floating button */
    #glwr-float-btn {
      position: fixed !important;
      z-index: 2147483647 !important;
      width: 56px !important;
      height: 56px !important;
      border-radius: 28px !important;
      background: #1f75cb !important;
      color: #fff !important;
      border: none !important;
      cursor: grab !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      line-height: 1.2 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
      transition: box-shadow 0.2s !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      padding: 0 !important;
      margin: 0 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      touch-action: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    #glwr-float-btn:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.35) !important;
    }
    #glwr-float-btn.glwr-dragging {
      cursor: grabbing !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
      transition: none !important;
    }

    /* Overlay */
    #glwr-overlay {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0,0,0,0.3) !important;
      z-index: 2147483646 !important;
      opacity: 0;
      pointer-events: none !important;
      transition: opacity 0.3s;
    }
    #glwr-overlay.glwr-open {
      opacity: 1;
      pointer-events: auto !important;
    }

    /* Drawer */
    #glwr-drawer {
      position: fixed !important;
      right: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 640px !important;
      max-width: 100vw !important;
      z-index: 2147483647 !important;
      background: #fff;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #333;
    }
    #glwr-drawer.glwr-open {
      transform: translateX(0);
    }

    /* Header */
    .glwr-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e5e5;
      flex-shrink: 0;
    }
    .glwr-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .glwr-header-close {
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #666;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .glwr-header-close:hover {
      background: #f0f0f0;
    }

    /* Scrollable body */
    .glwr-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 20px 20px;
    }

    /* Section */
    .glwr-section {
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .glwr-section:last-child {
      border-bottom: none;
    }
    .glwr-section-title {
      font-size: 13px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    /* Status bar */
    .glwr-status-bar {
      padding: 12px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e5e5e5;
      font-size: 13px;
      flex-shrink: 0;
    }
    .glwr-status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .glwr-status-green { background: #28a745; }
    .glwr-status-yellow { background: #ffc107; }
    .glwr-status-red { background: #dc3545; }

    /* Form elements */
    .glwr-row {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    }
    .glwr-label {
      font-size: 13px;
      color: #555;
      min-width: 64px;
    }
    #glwr-drawer input[type="date"],
    #glwr-drawer input[type="text"],
    #glwr-drawer input[type="number"],
    #glwr-drawer input[type="password"],
    #glwr-drawer select {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
      background: #fff;
      color: #333;
      outline: none;
    }
    #glwr-drawer input:focus,
    #glwr-drawer select:focus {
      border-color: #1f75cb;
      box-shadow: 0 0 0 2px rgba(31,117,203,0.15);
    }
    #glwr-drawer input[type="date"] {
      width: 140px;
    }
    #glwr-drawer input[type="number"] {
      width: 80px;
    }

    /* Buttons */
    .glwr-btn {
      padding: 7px 16px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #fff;
      color: #333;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .glwr-btn:hover {
      background: #f3f4f6;
    }
    .glwr-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .glwr-btn-primary {
      background: #1f75cb;
      color: #fff;
      border-color: #1f75cb;
    }
    .glwr-btn-primary:hover {
      background: #1a67b3;
    }
    .glwr-btn-danger {
      background: #dc3545;
      color: #fff;
      border-color: #dc3545;
    }
    .glwr-btn-danger:hover {
      background: #c82333;
    }
    .glwr-btn-sm {
      padding: 4px 10px;
      font-size: 12px;
    }
    .glwr-btn-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Checkbox */
    .glwr-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .glwr-checkbox input[type="checkbox"] {
      margin: 0;
    }

    /* Log area */
    #glwr-log {
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 12px;
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 8px;
    }
    #glwr-log .glwr-log-time {
      color: #6a9955;
    }
    #glwr-log .glwr-log-error {
      color: #f48771;
    }

    /* Output textarea */
    #glwr-output {
      width: 100%;
      min-height: 360px;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      box-sizing: border-box;
      background: #fafafa;
      color: #333;
      outline: none;
      margin-top: 8px;
    }
    #glwr-output:focus {
      border-color: #1f75cb;
      box-shadow: 0 0 0 2px rgba(31,117,203,0.15);
    }

    /* Stats bar */
    .glwr-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .glwr-stats span {
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 3px;
    }

    /* Details (advanced settings) */
    #glwr-drawer details {
      margin-top: 8px;
    }
    #glwr-drawer summary {
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      padding: 8px 0;
      user-select: none;
    }
    #glwr-drawer summary:hover {
      color: #1f75cb;
    }
    .glwr-advanced-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }
    .glwr-advanced-field label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    .glwr-advanced-field input,
    .glwr-advanced-field select {
      width: 100%;
      box-sizing: border-box;
    }

    /* Toast */
    #glwr-toast {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 100002;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 13px;
      color: #fff;
      background: #333;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    #glwr-toast.glwr-show {
      opacity: 1;
    }
    #glwr-toast.glwr-success { background: #28a745; }
    #glwr-toast.glwr-error { background: #dc3545; }
  `;

  // =========================================================================
  // 2. Config Module
  // =========================================================================

  const DEFAULT_CONFIG = {
    gitlabUrl: '', // will be set to location.origin at runtime
    token: '',
    username: '',
    timezone: 'Asia/Shanghai',
    projectIds: '',
    maxProjects: 30,
    includeMrs: true,
    includeMrCommits: true,
    includeDirectCommits: true,
    skipClosedMrs: true,
    filterMrByLatestCommitTime: true,
  };

  const Config = {
    _key: 'glwr_config',

    getDefault() {
      return { ...DEFAULT_CONFIG, gitlabUrl: location.origin };
    },

    load() {
      try {
        const saved = GM_getValue(this._key, null);
        if (saved) {
          const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
          return { ...this.getDefault(), ...parsed };
        }
      } catch (e) {
        console.warn('[GLWR] Failed to load config:', e);
      }
      return this.getDefault();
    },

    save(config) {
      GM_setValue(this._key, JSON.stringify(config));
    },

    reset() {
      GM_setValue(this._key, '');
      return this.getDefault();
    },
  };

  // =========================================================================
  // 3. DateUtil Module
  // =========================================================================

  const TZ_MAP = {
    'Asia/Shanghai': 8,
    'Asia/Chongqing': 8,
    'Asia/Hong_Kong': 8,
    'Asia/Taipei': 8,
    'Asia/Singapore': 8,
    'Asia/Tokyo': 9,
    'Asia/Seoul': 9,
    'Asia/Kolkata': 5.5,
    'Asia/Dubai': 4,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Berlin': 1,
    'Europe/Moscow': 3,
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Sao_Paulo': -3,
    'Pacific/Auckland': 12,
    'Australia/Sydney': 10,
    'UTC': 0,
    'GMT': 0,
  };

  const DateUtil = {
    /**
     * Parse timezone string to numeric UTC offset in hours.
     */
    parseTimezoneOffset(tz) {
      if (!tz) return 0;

      // Direct lookup (case-insensitive)
      const tzLower = tz.toLowerCase();
      for (const [key, value] of Object.entries(TZ_MAP)) {
        if (key.toLowerCase() === tzLower) return value;
      }

      // Try parsing "UTC+N" or "UTC-N" format
      const utcMatch = tz.match(/^UTC\s*([+-]?\d+(?:\.\d+)?)$/i);
      if (utcMatch) return parseFloat(utcMatch[1]);

      // Try "+HH:MM" format
      const offsetMatch = tz.match(/^([+-])(\d{1,2}):?(\d{2})?$/);
      if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? 1 : -1;
        const hours = parseInt(offsetMatch[2], 10);
        const minutes = parseInt(offsetMatch[3] || '0', 10);
        return sign * (hours + minutes / 60);
      }

      console.warn(`[GLWR] Unknown timezone '${tz}', defaulting to UTC`);
      return 0;
    },

    /**
     * Format a date as YYYY-MM-DD.
     */
    formatDateStr(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    /**
     * Get date range for recent N days.
     */
    getRecentDaysRange(n) {
      const now = new Date();
      const since = new Date(now);
      since.setDate(since.getDate() - n);
      return {
        since: this.formatDateStr(since),
        until: this.formatDateStr(now),
      };
    },

    /**
     * Get current week range (Monday to Sunday).
     */
    getCurrentWeekRange() {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 1=Mon, ...
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        since: this.formatDateStr(monday),
        until: this.formatDateStr(sunday),
      };
    },

    /**
     * Get last week range (Monday to Sunday).
     */
    getLastWeekRange() {
      const now = new Date();
      const day = now.getDay();
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return {
        since: this.formatDateStr(lastMonday),
        until: this.formatDateStr(lastSunday),
      };
    },

    /**
     * Convert a local date string to UTC ISO string for GitLab API.
     * If endOfDay is true, set to 23:59:59; otherwise 00:00:00.
     */
    localDateToUtcIso(dateStr, endOfDay, tzOffsetHours) {
      if (!dateStr) return '';
      const offset = typeof tzOffsetHours === 'number' ? tzOffsetHours : 0;
      // Parse date as local midnight
      const [year, month, day] = dateStr.split('-').map(Number);
      let hours = endOfDay ? 23 : 0;
      let minutes = endOfDay ? 59 : 0;
      let seconds = endOfDay ? 59 : 0;
      // Subtract timezone offset to get UTC
      const utcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds) - offset * 3600 * 1000;
      return new Date(utcMs).toISOString();
    },

    /**
     * Format a UTC ISO time string to local readable time.
     */
    formatLocalTime(isoStr, tzOffsetHours) {
      if (!isoStr || isoStr === 'None') return isoStr || '';
      try {
        const offset = typeof tzOffsetHours === 'number' ? tzOffsetHours : 0;
        const dt = new Date(isoStr.replace('Z', '+00:00'));
        if (isNaN(dt.getTime())) return isoStr;
        const localMs = dt.getTime() + offset * 3600 * 1000;
        const local = new Date(localMs);
        const y = local.getUTCFullYear();
        const mo = String(local.getUTCMonth() + 1).padStart(2, '0');
        const d = String(local.getUTCDate()).padStart(2, '0');
        const h = String(local.getUTCHours()).padStart(2, '0');
        const mi = String(local.getUTCMinutes()).padStart(2, '0');
        const s = String(local.getUTCSeconds()).padStart(2, '0');
        const sign = offset >= 0 ? '+' : '';
        return `${y}-${mo}-${d} ${h}:${mi}:${s} (UTC${sign}${offset})`;
      } catch (e) {
        return isoStr;
      }
    },
  };

  // =========================================================================
  // 4. GitLabApi Module
  // =========================================================================

  const GitLabApi = {
    _baseUrl: '',
    _apiUrl: '',
    _token: '',
    _abortController: null,

    init(baseUrl, token) {
      this._baseUrl = (baseUrl || location.origin).replace(/\/+$/, '');
      this._apiUrl = this._baseUrl + '/api/v4';
      this._token = token || '';
    },

    setAbortController(ac) {
      this._abortController = ac;
    },

    async get(path, params = {}, paginated = false) {
      const url = new URL(this._apiUrl + path);
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }

      if (paginated) {
        url.searchParams.set('per_page', '100');
        url.searchParams.set('page', '1');
      }

      const headers = { Accept: 'application/json' };
      if (this._token) {
        headers['PRIVATE-TOKEN'] = this._token;
      }

      const fetchOpts = {
        credentials: 'include',
        headers,
      };
      if (this._abortController) {
        fetchOpts.signal = this._abortController.signal;
      }

      const resp = await fetch(url.toString(), fetchOpts);

      if (resp.status === 401) {
        throw new Error('401 Unauthorized: Token 无效或当前登录态不可用。请在高级设置中填写 Token。');
      }
      if (resp.status === 403) {
        throw new Error('403 Forbidden: Token 没有权限访问该接口或项目。请检查 Token 是否具备 read_api 权限。');
      }
      if (resp.status === 404) {
        throw new Error(`404 Not Found: ${path}`);
      }
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${path}`);
      }

      const data = await resp.json();
      if (!paginated) return data;

      // Handle paginated response
      if (!Array.isArray(data)) return data;

      const results = [...data];
      let nextPage = resp.headers.get('X-Next-Page');

      while (nextPage) {
        url.searchParams.set('page', nextPage);

        const pageResp = await fetch(url.toString(), fetchOpts);
        if (!pageResp.ok) {
          throw new Error(`HTTP ${pageResp.status} ${pageResp.statusText}: ${path} (page ${nextPage})`);
        }

        const pageData = await pageResp.json();
        if (!Array.isArray(pageData) || pageData.length === 0) break;
        results.push(...pageData);
        nextPage = pageResp.headers.get('X-Next-Page');
      }

      return results;
    },

    async getPaged(path, params = {}) {
      return this.get(path, params, true);
    },

    async getCurrentUser() {
      return this.get('/user');
    },

    async getUserByUsername(username) {
      const users = await this.getPaged('/users', { username });
      if (!users || users.length === 0) {
        throw new Error(`找不到 GitLab 用户：${username}`);
      }
      return users[0];
    },

    async listMyMergeRequests(username, sinceIso) {
      return this.getPaged('/merge_requests', {
        scope: 'all',
        author_username: username,
        state: 'all',
        updated_after: sinceIso,
        order_by: 'updated_at',
        sort: 'desc',
      });
    },

    async listMrCommits(projectId, mrIid) {
      return this.getPaged(`/projects/${projectId}/merge_requests/${mrIid}/commits`);
    },

    async listActiveMemberProjects(sinceIso, maxProjects) {
      const projects = await this.getPaged('/projects', {
        membership: true,
        archived: false,
        last_activity_after: sinceIso,
        order_by: 'last_activity_at',
        sort: 'desc',
        simple: true,
      });
      return projects.slice(0, maxProjects || 30);
    },

    async getProject(projectId) {
      return this.get(`/projects/${projectId}`);
    },

    async listProjectCommits(projectId, sinceIso, untilIso, author) {
      const params = {
        since: sinceIso,
        until: untilIso,
        with_stats: true,
      };
      if (author) params.author = author;
      return this.getPaged(`/projects/${projectId}/repository/commits`, params);
    },
  };

  // =========================================================================
  // 5. Collector Module
  // =========================================================================

  const Collector = {
    collectCommitAuthorCandidates(user) {
      const candidates = new Set();
      for (const key of ['username', 'name', 'email', 'public_email', 'commit_email']) {
        const value = user[key];
        if (value) candidates.add(value);
      }
      return [...candidates].sort();
    },

    dedupeCommits(commits) {
      const seen = {};
      for (const c of commits) {
        const sha = c.id || c.short_id;
        if (sha) seen[sha] = c;
      }
      return Object.values(seen);
    },

    async collectAll(config, onLog) {
      const tzOffset = DateUtil.parseTimezoneOffset(config.timezone);
      const sinceIso = DateUtil.localDateToUtcIso(config.sinceDate, false, tzOffset);
      const untilIso = DateUtil.localDateToUtcIso(config.untilDate, true, tzOffset);

      onLog('正在初始化 API...');
      GitLabApi.init(config.gitlabUrl || location.origin, config.token);

      // 1. Get current user
      onLog('正在读取当前用户...');
      let currentUser;
      try {
        currentUser = await GitLabApi.getCurrentUser();
        onLog(`当前 Token 用户：${currentUser.name} (@${currentUser.username})`);
      } catch (e) {
        throw new Error(`获取当前用户失败：${e.message}`);
      }

      // 2. Determine target user
      let user = currentUser;
      if (config.username && config.username !== currentUser.username) {
        onLog(`正在查询用户 @${config.username}...`);
        try {
          const targetUser = await GitLabApi.getUserByUsername(config.username);
          // Merge info if same user
          if (targetUser.username === currentUser.username) {
            user = { ...currentUser, ...targetUser };
          } else {
            user = targetUser;
          }
          onLog(`目标用户：${user.name} (@${user.username})`);
        } catch (e) {
          onLog(`[WARN] 查询用户失败，使用当前 Token 用户：${e.message}`);
        }
      }

      const username = user.username || config.username;
      if (!username) {
        throw new Error('无法确定 GitLab username。请在高级设置中填写 Username。');
      }

      onLog(`查询用户名：@${username}`);

      const rawData = {
        user,
        range: {
          sinceDate: config.sinceDate,
          untilDate: config.untilDate,
          sinceIso,
          untilIso,
          timezone: config.timezone,
        },
        mrs: [],
        mrCommitsMap: {},
        projectMeta: {},
        commitsByProject: {},
        warnings: [],
        stats: {
          mrCount: 0,
          mrCommitCount: 0,
          projectCount: 0,
          directCommitCount: 0,
        },
      };

      // 3. Collect MRs
      if (config.includeMrs) {
        onLog('正在读取 Merge Requests...');
        try {
          const mrs = await GitLabApi.listMyMergeRequests(username, sinceIso);
          rawData.mrs = mrs;
          rawData.stats.mrCount = mrs.length;
          onLog(`读取到 ${mrs.length} 个 MR`);
        } catch (e) {
          const msg = `读取 MR 失败：${e.message}`;
          onLog(`[ERROR] ${msg}`);
          rawData.warnings.push(msg);
        }

        // 4. Collect MR commits
        if (config.includeMrCommits && rawData.mrs.length > 0) {
          for (let i = 0; i < rawData.mrs.length; i++) {
            if (GitLabApi._abortController && GitLabApi._abortController.signal.aborted) {
              onLog('已停止');
              break;
            }
            const mr = rawData.mrs[i];
            const projectId = mr.project_id;
            const iid = mr.iid;
            const key = `${projectId}!${iid}`;
            onLog(`正在读取 MR commits：${i + 1} / ${rawData.mrs.length}`);
            try {
              const commits = await GitLabApi.listMrCommits(projectId, iid);
              rawData.mrCommitsMap[key] = commits;
              rawData.stats.mrCommitCount += commits.length;
            } catch (e) {
              onLog(`[WARN] 读取 MR ${key} commits 失败：${e.message}`);
              rawData.mrCommitsMap[key] = [];
            }
          }
        }
      }

      // 5. Collect direct commits
      if (config.includeDirectCommits) {
        let projectIds = [];

        if (config.projectIds && config.projectIds.trim()) {
          projectIds = config.projectIds.split(',').map(s => s.trim()).filter(Boolean);
          onLog(`使用指定项目 ID：${projectIds.join(', ')}`);
        } else {
          onLog('正在扫描活跃项目...');
          try {
            const projects = await GitLabApi.listActiveMemberProjects(sinceIso, config.maxProjects);
            projectIds = projects.map(p => String(p.id));
            rawData.stats.projectCount = projectIds.length;
            onLog(`自动选择 ${projectIds.length} 个项目`);
          } catch (e) {
            const msg = `扫描活跃项目失败：${e.message}`;
            onLog(`[ERROR] ${msg}`);
            rawData.warnings.push(msg);
          }
        }

        const authorCandidates = this.collectCommitAuthorCandidates(user);
        onLog(`Commit 作者候选：${authorCandidates.join(', ')}`);

        for (let i = 0; i < projectIds.length; i++) {
          if (GitLabApi._abortController && GitLabApi._abortController.signal.aborted) {
            onLog('已停止');
            break;
          }
          const pid = projectIds[i];
          onLog(`正在读取项目 commits：${i + 1} / ${projectIds.length} (ID: ${pid})`);

          try {
            const project = await GitLabApi.getProject(pid);
            rawData.projectMeta[pid] = project;
          } catch (e) {
            onLog(`[WARN] 获取项目 ${pid} 信息失败：${e.message}`);
            continue;
          }

          let allCommits = [];
          for (const author of authorCandidates) {
            try {
              const commits = await GitLabApi.listProjectCommits(pid, sinceIso, untilIso, author);
              allCommits.push(...commits);
            } catch (e) {
              onLog(`[WARN] 项目 ${pid} author=${author} 查询失败：${e.message}`);
            }
          }

          const deduped = this.dedupeCommits(allCommits);
          if (deduped.length > 0) {
            rawData.commitsByProject[pid] = deduped;
            rawData.stats.directCommitCount += deduped.length;
          }
        }
      }

      // Pass filter settings into rawData for Renderer
      rawData.skipClosedMrs = config.skipClosedMrs;
      rawData.filterMrByLatestCommitTime = config.filterMrByLatestCommitTime;

      return rawData;
    },
  };

  // =========================================================================
  // 6. Renderer Module
  // =========================================================================

  const Renderer = {
    shortSha(sha) {
      return sha ? sha.substring(0, 8) : '';
    },

    safeText(value) {
      if (value === null || value === undefined) return '';
      return String(value).replace(/\n/g, ' ').trim();
    },

    renderMarkdown(rawData) {
      const lines = [];
      const tzOffset = DateUtil.parseTimezoneOffset(rawData.range.timezone);

      lines.push('# GitLab Weekly Raw Report');
      lines.push('');
      lines.push(...this.renderBasicInfo(rawData, tzOffset));
      lines.push(...this.renderMergeRequests(rawData, tzOffset));
      lines.push(...this.renderDirectCommits(rawData, tzOffset));
      lines.push(...this.renderAiPrompt());

      return lines.join('\n');
    },

    renderBasicInfo(rawData, tzOffset) {
      const lines = [];
      const { user, range } = rawData;

      lines.push('## 基本信息');
      lines.push('');
      lines.push(`- 用户：${user.name || ''} (@${user.username || ''})`);
      lines.push(`- 时间范围：${DateUtil.formatLocalTime(range.sinceIso, tzOffset)} ~ ${DateUtil.formatLocalTime(range.untilIso, tzOffset)}`);
      lines.push('');

      return lines;
    },

    renderMergeRequests(rawData, tzOffset) {
      const lines = [];
      const { mrs, mrCommitsMap, range } = rawData;
      const since = new Date(range.sinceIso);
      const until = new Date(range.untilIso);

      lines.push('## 1. 本周 Merge Requests');
      lines.push('');

      if (!mrs || mrs.length === 0) {
        lines.push('本周没有抓取到 MR。');
        lines.push('');
        return lines;
      }

      let shownAny = false;

      for (const mr of mrs) {
        // Skip closed MRs
        if (mr.state === 'closed' && rawData.skipClosedMrs) {
          continue;
        }

        const projectId = mr.project_id;
        const iid = mr.iid;
        const key = `${projectId}!${iid}`;
        const ref = (mr.references && mr.references.full) || `!${iid}`;

        // Find latest commit time
        const commits = mrCommitsMap[key] || [];
        let latestCommitTime = null;
        if (commits.length > 0) {
          const commitTimes = commits
            .map(c => c.committed_date || c.created_at)
            .filter(Boolean);
          if (commitTimes.length > 0) {
            latestCommitTime = commitTimes.sort().pop();
          }
        }

        // Filter by latest commit time
        if (latestCommitTime && rawData.filterMrByLatestCommitTime) {
          try {
            const lct = new Date(latestCommitTime.replace('Z', '+00:00'));
            if (lct < since || lct > until) continue;
          } catch (e) {
            // If parsing fails, show the MR anyway
          }
        }

        shownAny = true;
        lines.push(`### ${ref} ${this.safeText(mr.title)}`);
        lines.push('');
        lines.push(`- 项目 ID：\`${projectId}\``);
        lines.push(`- 状态：\`${mr.state}\``);
        lines.push(`- 源分支：\`${mr.source_branch}\``);
        lines.push(`- 目标分支：\`${mr.target_branch}\``);
        lines.push(`- 创建时间：${DateUtil.formatLocalTime(mr.created_at, tzOffset)}`);
        if (latestCommitTime) {
          lines.push(`- 最后提交时间：${DateUtil.formatLocalTime(latestCommitTime, tzOffset)}`);
        }
        lines.push(`- 更新时间：${DateUtil.formatLocalTime(mr.updated_at, tzOffset)}`);
        if (mr.merged_at) {
          lines.push(`- 合并时间：${DateUtil.formatLocalTime(mr.merged_at, tzOffset)}`);
        }
        lines.push('');

        // MR description
        const description = mr.description;
        if (description) {
          const descStr = String(description).trim();
          if (descStr) {
            lines.push('MR 描述摘要：');
            lines.push('');
            for (const descLine of descStr.split('\n')) {
              lines.push(`> ${descLine}`);
            }
            lines.push('');
          }
        }

        // MR commits
        lines.push('关联 Commits：');
        if (commits.length === 0) {
          lines.push('- 未抓取到 commit。');
        } else {
          for (const c of commits) {
            lines.push(`- \`${this.shortSha(c.id)}\` ${this.safeText(c.title)}`);
          }
        }
        lines.push('');
      }

      if (!shownAny) {
        lines.push('本周没有符合条件的 MR（所有 MR 的最后提交时间均不在本周范围内）。');
        lines.push('');
      }

      return lines;
    },

    renderDirectCommits(rawData, tzOffset) {
      const lines = [];
      const { commitsByProject, projectMeta } = rawData;

      lines.push('## 2. 本周 Direct Commits');
      lines.push('');
      lines.push('> 这部分来自项目级 Commits API，用于补充没有走 MR 的提交，或者 MR 查询没有覆盖到的提交。');
      lines.push('');

      const projectIds = Object.keys(commitsByProject);
      if (projectIds.length === 0) {
        lines.push('没有配置项目 ID，也没有自动扫描到活跃项目。');
        lines.push('');
        return lines;
      }

      let anyCommit = false;

      for (const pid of projectIds) {
        const commits = commitsByProject[pid];
        if (!commits || commits.length === 0) continue;

        anyCommit = true;
        const project = projectMeta[pid] || {};
        const projectName = project.path_with_namespace || project.name || pid;

        lines.push(`### ${projectName}`);
        lines.push('');

        for (const c of commits) {
          const stats = c.stats || {};
          const additions = stats.additions !== undefined ? stats.additions : '?';
          const deletions = stats.deletions !== undefined ? stats.deletions : '?';

          lines.push(`- \`${this.shortSha(c.id)}\` ${this.safeText(c.title)}`);
          lines.push(`  - 作者：${this.safeText(c.author_name)} <${this.safeText(c.author_email)}>`);
          lines.push(`  - 时间：${c.created_at}`);
          lines.push(`  - 改动：+${additions} / -${deletions}`);
          if (c.web_url) {
            lines.push(`  - 链接：${c.web_url}`);
          }
        }
        lines.push('');
      }

      if (!anyCommit) {
        lines.push('本周没有抓取到 direct commit。');
        lines.push('');
      }

      return lines;
    },

    renderAiPrompt() {
      const lines = [];
      lines.push('## 3. 给 AI 的周报生成提示词');
      lines.push('');
      lines.push('请根据以上 GitLab 原始记录，生成一份中文周报。');
      lines.push('');
      lines.push('要求：');
      lines.push('');
      lines.push('1. 不要逐条翻译 commit，要归纳成工作事项。');
      lines.push('2. 语气适合发给上级，不要太口语化。');
      lines.push('3. 按「本周完成」「问题修复」「进行中」「下周计划」组织。');
      lines.push('4. 对嵌入式 Linux、SDK、镜像烧录、Debian 打包、GitLab workflow 等关键词保留必要技术信息。');
      lines.push('5. 如果某些 commit/MR 看不出业务意义，请归类为「代码维护 / 构建修复 / 流程优化」。');
      lines.push('6. 输出简洁版，不要写成日报。');
      lines.push('');
      return lines;
    },
  };

  // =========================================================================
  // 7. Download Module
  // =========================================================================

  const Download = {
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textarea);
          return true;
        } catch (e2) {
          document.body.removeChild(textarea);
          return false;
        }
      }
    },

    downloadFile(filename, content, mimeType) {
      const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },

    makeFilename(user, range, ext) {
      const username = (user && user.username) || 'unknown';
      const since = (range && range.sinceDate) || 'start';
      const until = (range && range.untilDate) || 'end';
      return `gitlab-weekly-${username}-${since}_${until}.${ext}`;
    },
  };

  // =========================================================================
  // 8. DrawerUI Module
  // =========================================================================

  const DrawerUI = {
    _elements: {},
    _abortController: null,
    _currentRawData: null,
    _callbacks: {},

    inject(config) {
      // Inject styles
      GM_addStyle(CSS_STYLES);

      // Create floating button
      const floatBtn = document.createElement('button');
      floatBtn.id = 'glwr-float-btn';
      floatBtn.innerHTML = 'GitLab<br>周报';
      floatBtn.title = 'GitLab 周报助手';
      floatBtn.type = 'button';

      // Restore saved position or default to bottom-right
      let savedPos = null;
      try {
        const raw = GM_getValue('glwr_btn_pos', null);
        if (raw) savedPos = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) { /* ignore */ }
      if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
        // Clamp to viewport
        const x = Math.max(0, Math.min(savedPos.x, window.innerWidth - 56));
        const y = Math.max(0, Math.min(savedPos.y, window.innerHeight - 56));
        floatBtn.style.left = x + 'px';
        floatBtn.style.top = y + 'px';
      } else {
        floatBtn.style.left = (window.innerWidth - 56 - 24) + 'px';
        floatBtn.style.top = (window.innerHeight - 56 - 24) + 'px';
      }

      document.body.appendChild(floatBtn);

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'glwr-overlay';
      document.body.appendChild(overlay);

      // Create toast
      const toast = document.createElement('div');
      toast.id = 'glwr-toast';
      document.body.appendChild(toast);

      // Create drawer
      const drawer = document.createElement('div');
      drawer.id = 'glwr-drawer';
      drawer.innerHTML = this._buildDrawerHTML(config);
      document.body.appendChild(drawer);

      // Cache element references
      this._elements = {
        floatBtn,
        overlay,
        drawer,
        toast,
        closeBtn: drawer.querySelector('#glwr-close-btn'),
        testBtn: drawer.querySelector('#glwr-test-btn'),
        statusText: drawer.querySelector('#glwr-status-text'),
        statusDot: drawer.querySelector('#glwr-status-dot'),
        statusDetail: drawer.querySelector('#glwr-status-detail'),
        sinceDate: drawer.querySelector('#glwr-since-date'),
        untilDate: drawer.querySelector('#glwr-until-date'),
        quickToday: drawer.querySelector('#glwr-quick-today'),
        quick7Days: drawer.querySelector('#glwr-quick-7days'),
        quickThisWeek: drawer.querySelector('#glwr-quick-this-week'),
        quickLastWeek: drawer.querySelector('#glwr-quick-last-week'),
        includeMrs: drawer.querySelector('#glwr-include-mrs'),
        includeMrCommits: drawer.querySelector('#glwr-include-mr-commits'),
        includeDirectCommits: drawer.querySelector('#glwr-include-direct-commits'),
        generateBtn: drawer.querySelector('#glwr-generate-btn'),
        stopBtn: drawer.querySelector('#glwr-stop-btn'),
        clearBtn: drawer.querySelector('#glwr-clear-btn'),
        log: drawer.querySelector('#glwr-log'),
        output: drawer.querySelector('#glwr-output'),
        stats: drawer.querySelector('#glwr-stats'),
        copyBtn: drawer.querySelector('#glwr-copy-btn'),
        downloadMdBtn: drawer.querySelector('#glwr-download-md-btn'),
        downloadJsonBtn: drawer.querySelector('#glwr-download-json-btn'),
        // Advanced settings
        advBaseUrl: drawer.querySelector('#glwr-adv-base-url'),
        advToken: drawer.querySelector('#glwr-adv-token'),
        advUsername: drawer.querySelector('#glwr-adv-username'),
        advTimezone: drawer.querySelector('#glwr-adv-timezone'),
        advProjectIds: drawer.querySelector('#glwr-adv-project-ids'),
        advMaxProjects: drawer.querySelector('#glwr-adv-max-projects'),
        advSkipClosed: drawer.querySelector('#glwr-adv-skip-closed'),
        advFilterMrTime: drawer.querySelector('#glwr-adv-filter-mr-time'),
        saveSettingsBtn: drawer.querySelector('#glwr-save-settings-btn'),
        resetSettingsBtn: drawer.querySelector('#glwr-reset-settings-btn'),
      };

      // Set initial status
      this.setStatus('未连接', 'yellow');
    },

    _buildDrawerHTML(config) {
      const defaultRange = DateUtil.getRecentDaysRange(7);
      const sinceVal = config.sinceDate || defaultRange.since;
      const untilVal = config.untilDate || defaultRange.until;

      return `
        <div class="glwr-header">
          <h2>GitLab 周报助手</h2>
          <button id="glwr-close-btn" class="glwr-header-close" title="关闭">&times;</button>
        </div>

        <div class="glwr-status-bar">
          <div>
            <span id="glwr-status-dot" class="glwr-status-dot glwr-status-yellow"></span>
            <span id="glwr-status-text">未连接</span>
          </div>
          <div id="glwr-status-detail" style="margin-top:4px;font-size:12px;color:#888;"></div>
          <div style="margin-top:8px;">
            <button id="glwr-test-btn" class="glwr-btn glwr-btn-sm">测试连接</button>
          </div>
        </div>

        <div class="glwr-body">
          <!-- Time Range -->
          <div class="glwr-section">
            <div class="glwr-section-title">时间范围</div>
            <div class="glwr-row">
              <span class="glwr-label">开始日期</span>
              <input type="date" id="glwr-since-date" value="${sinceVal}">
            </div>
            <div class="glwr-row">
              <span class="glwr-label">结束日期</span>
              <input type="date" id="glwr-until-date" value="${untilVal}">
            </div>
            <div class="glwr-row" style="margin-top:6px;">
              <span class="glwr-label">快捷</span>
              <div class="glwr-btn-group">
                <button id="glwr-quick-today" class="glwr-btn glwr-btn-sm">今天</button>
                <button id="glwr-quick-7days" class="glwr-btn glwr-btn-sm">最近 7 天</button>
                <button id="glwr-quick-this-week" class="glwr-btn glwr-btn-sm">本周</button>
                <button id="glwr-quick-last-week" class="glwr-btn glwr-btn-sm">上周</button>
              </div>
            </div>
          </div>

          <!-- Data Source -->
          <div class="glwr-section">
            <div class="glwr-section-title">包含内容</div>
            <label class="glwr-checkbox">
              <input type="checkbox" id="glwr-include-mrs" ${config.includeMrs ? 'checked' : ''}>
              Merge Requests
            </label>
            <label class="glwr-checkbox">
              <input type="checkbox" id="glwr-include-mr-commits" ${config.includeMrCommits ? 'checked' : ''}>
              MR 关联 Commits
            </label>
            <label class="glwr-checkbox">
              <input type="checkbox" id="glwr-include-direct-commits" ${config.includeDirectCommits ? 'checked' : ''}>
              Direct Commits
            </label>
          </div>

          <!-- Actions -->
          <div class="glwr-section">
            <div class="glwr-btn-group">
              <button id="glwr-generate-btn" class="glwr-btn glwr-btn-primary">生成 Markdown</button>
              <button id="glwr-stop-btn" class="glwr-btn glwr-btn-danger" disabled>停止</button>
              <button id="glwr-clear-btn" class="glwr-btn">清空结果</button>
            </div>
          </div>

          <!-- Log -->
          <div class="glwr-section">
            <div class="glwr-section-title">进度日志</div>
            <div id="glwr-log"></div>
          </div>

          <!-- Output -->
          <div class="glwr-section">
            <div class="glwr-section-title">Markdown 预览</div>
            <div id="glwr-stats" class="glwr-stats"></div>
            <textarea id="glwr-output" placeholder="生成的 Markdown 将显示在这里..."></textarea>
          </div>

          <!-- Download -->
          <div class="glwr-section">
            <div class="glwr-btn-group">
              <button id="glwr-copy-btn" class="glwr-btn glwr-btn-primary">复制 Markdown</button>
              <button id="glwr-download-md-btn" class="glwr-btn">下载 .md</button>
              <button id="glwr-download-json-btn" class="glwr-btn">下载 raw.json</button>
            </div>
          </div>

          <!-- Advanced Settings -->
          <div class="glwr-section">
            <details>
              <summary>高级设置</summary>

              <div class="glwr-advanced-field">
                <label>GitLab Base URL</label>
                <input type="text" id="glwr-adv-base-url" value="${config.gitlabUrl || location.origin}" placeholder="${location.origin}">
              </div>

              <div class="glwr-advanced-field">
                <label>Token（可选，优先使用登录态）</label>
                <input type="password" id="glwr-adv-token" value="${config.token || ''}" placeholder="glpat-xxxxxxxxxxxxxxxxxxxx">
              </div>

              <div class="glwr-advanced-field">
                <label>Username（留空则自动获取）</label>
                <input type="text" id="glwr-adv-username" value="${config.username || ''}" placeholder="yunhao.gu">
              </div>

              <div class="glwr-advanced-field">
                <label>Timezone</label>
                <select id="glwr-adv-timezone">
                  <option value="Asia/Shanghai" ${config.timezone === 'Asia/Shanghai' ? 'selected' : ''}>Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Singapore" ${config.timezone === 'Asia/Singapore' ? 'selected' : ''}>Asia/Singapore (UTC+8)</option>
                  <option value="Asia/Tokyo" ${config.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Asia/Tokyo (UTC+9)</option>
                  <option value="UTC" ${config.timezone === 'UTC' ? 'selected' : ''}>UTC (UTC+0)</option>
                  <option value="UTC+8" ${config.timezone === 'UTC+8' ? 'selected' : ''}>UTC+8</option>
                </select>
              </div>

              <div class="glwr-advanced-field">
                <label>Project IDs（逗号分隔，留空则自动扫描）</label>
                <input type="text" id="glwr-adv-project-ids" value="${config.projectIds || ''}" placeholder="123,456,789">
              </div>

              <div class="glwr-advanced-field">
                <label>最大扫描项目数</label>
                <input type="number" id="glwr-adv-max-projects" value="${config.maxProjects || 30}" min="1" max="200">
              </div>

              <div style="margin:12px 0;">
                <div class="glwr-section-title">过滤规则</div>
                <label class="glwr-checkbox">
                  <input type="checkbox" id="glwr-adv-skip-closed" ${config.skipClosedMrs ? 'checked' : ''}>
                  跳过 closed MR
                </label>
                <label class="glwr-checkbox">
                  <input type="checkbox" id="glwr-adv-filter-mr-time" ${config.filterMrByLatestCommitTime ? 'checked' : ''}>
                  MR 最新提交时间必须在时间范围内
                </label>
              </div>

              <div class="glwr-btn-group">
                <button id="glwr-save-settings-btn" class="glwr-btn glwr-btn-primary glwr-btn-sm">保存设置</button>
                <button id="glwr-reset-settings-btn" class="glwr-btn glwr-btn-sm">恢复默认</button>
              </div>
            </details>
          </div>
        </div>
      `;
    },

    open() {
      this._elements.overlay.classList.add('glwr-open');
      this._elements.drawer.classList.add('glwr-open');
    },

    close() {
      this._elements.overlay.classList.remove('glwr-open');
      this._elements.drawer.classList.remove('glwr-open');
    },

    setStatus(text, type) {
      const { statusText, statusDot } = this._elements;
      statusText.textContent = text;
      statusDot.className = `glwr-status-dot glwr-status-${type || 'yellow'}`;
    },

    setStatusDetail(text) {
      this._elements.statusDetail.textContent = text || '';
    },

    appendLog(msg, isError) {
      const log = this._elements.log;
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const line = document.createElement('div');
      if (isError) {
        line.className = 'glwr-log-error';
        line.innerHTML = `<span class="glwr-log-time">[${time}]</span> ${this._escapeHtml(msg)}`;
      } else {
        line.innerHTML = `<span class="glwr-log-time">[${time}]</span> ${this._escapeHtml(msg)}`;
      }
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    },

    clearLog() {
      this._elements.log.innerHTML = '';
    },

    setOutput(text) {
      this._elements.output.value = text || '';
    },

    getOutput() {
      return this._elements.output.value;
    },

    setStats(stats) {
      const el = this._elements.stats;
      if (!stats) {
        el.innerHTML = '';
        return;
      }
      el.innerHTML = [
        `<span>MR: ${stats.mrCount}</span>`,
        `<span>MR Commits: ${stats.mrCommitCount}</span>`,
        `<span>项目: ${stats.projectCount}</span>`,
        `<span>Direct Commits: ${stats.directCommitCount}</span>`,
      ].join('');
    },

    setLoading(loading) {
      const { generateBtn, stopBtn } = this._elements;
      if (loading) {
        generateBtn.disabled = true;
        generateBtn.textContent = '正在生成...';
        stopBtn.disabled = false;
      } else {
        generateBtn.disabled = false;
        generateBtn.textContent = '生成 Markdown';
        stopBtn.disabled = true;
      }
    },

    showToast(message, type) {
      const toast = this._elements.toast;
      toast.textContent = message;
      toast.className = `glwr-show glwr-${type || 'success'}`;
      setTimeout(() => {
        toast.className = '';
      }, 2500);
    },

    getFormConfig() {
      const el = this._elements;
      return {
        gitlabUrl: el.advBaseUrl.value || location.origin,
        token: el.advToken.value.trim(),
        username: el.advUsername.value.trim(),
        timezone: el.advTimezone.value,
        projectIds: el.advProjectIds.value.trim(),
        maxProjects: parseInt(el.advMaxProjects.value, 10) || 30,
        includeMrs: el.includeMrs.checked,
        includeMrCommits: el.includeMrCommits.checked,
        includeDirectCommits: el.includeDirectCommits.checked,
        skipClosedMrs: el.advSkipClosed.checked,
        filterMrByLatestCommitTime: el.advFilterMrTime.checked,
        sinceDate: el.sinceDate.value,
        untilDate: el.untilDate.value,
      };
    },

    setFormConfig(config) {
      const el = this._elements;
      if (config.sinceDate) el.sinceDate.value = config.sinceDate;
      if (config.untilDate) el.untilDate.value = config.untilDate;
      el.includeMrs.checked = config.includeMrs !== false;
      el.includeMrCommits.checked = config.includeMrCommits !== false;
      el.includeDirectCommits.checked = config.includeDirectCommits !== false;
      el.advToken.value = config.token || '';
      el.advUsername.value = config.username || '';
      el.advTimezone.value = config.timezone || 'Asia/Shanghai';
      el.advProjectIds.value = config.projectIds || '';
      el.advMaxProjects.value = config.maxProjects || 30;
      el.advSkipClosed.checked = config.skipClosedMrs !== false;
      el.advFilterMrTime.checked = config.filterMrByLatestCommitTime !== false;
      el.advBaseUrl.value = config.gitlabUrl || location.origin;
    },

    _escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    bindEvents(callbacks) {
      this._callbacks = callbacks || {};
      const el = this._elements;

      // Draggable floating button — distinguish click from drag
      (() => {
        const btn = el.floatBtn;
        let startX = 0, startY = 0;
        let btnStartLeft = 0, btnStartTop = 0;
        let dragging = false;
        let moved = false;

        const DRAG_THRESHOLD = 5; // px

        function onPointerDown(e) {
          // Only handle left mouse button or touch
          if (e.type === 'mousedown' && e.button !== 0) return;

          e.preventDefault();
          e.stopPropagation();

          const point = e.touches ? e.touches[0] : e;
          startX = point.clientX;
          startY = point.clientY;
          btnStartLeft = btn.offsetLeft;
          btnStartTop = btn.offsetTop;
          dragging = true;
          moved = false;

          document.addEventListener('mousemove', onPointerMove, { passive: false });
          document.addEventListener('mouseup', onPointerUp);
          document.addEventListener('touchmove', onPointerMove, { passive: false });
          document.addEventListener('touchend', onPointerUp);
        }

        function onPointerMove(e) {
          if (!dragging) return;
          e.preventDefault();

          const point = e.touches ? e.touches[0] : e;
          const dx = point.clientX - startX;
          const dy = point.clientY - startY;

          if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
            moved = true;
            btn.classList.add('glwr-dragging');
          }

          if (moved) {
            // Clamp to viewport
            let newLeft = Math.max(0, Math.min(btnStartLeft + dx, window.innerWidth - 56));
            let newTop = Math.max(0, Math.min(btnStartTop + dy, window.innerHeight - 56));
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
          }
        }

        function onPointerUp(e) {
          document.removeEventListener('mousemove', onPointerMove);
          document.removeEventListener('mouseup', onPointerUp);
          document.removeEventListener('touchmove', onPointerMove);
          document.removeEventListener('touchend', onPointerUp);

          btn.classList.remove('glwr-dragging');

          if (moved) {
            // Save position
            try {
              GM_setValue('glwr_btn_pos', JSON.stringify({ x: btn.offsetLeft, y: btn.offsetTop }));
            } catch (err) { /* ignore */ }
          } else {
            // It was a click — open drawer
            e.stopPropagation();
            e.stopImmediatePropagation();
            DrawerUI.open();
          }

          dragging = false;
          moved = false;
        }

        btn.addEventListener('mousedown', onPointerDown, true);
        btn.addEventListener('touchstart', onPointerDown, { passive: false });
      })();

      el.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.close();
      });
      el.overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });

      // Quick date buttons
      el.quickToday.addEventListener('click', () => {
        const range = DateUtil.getRecentDaysRange(0);
        el.sinceDate.value = range.since;
        el.untilDate.value = range.until;
      });
      el.quick7Days.addEventListener('click', () => {
        const range = DateUtil.getRecentDaysRange(7);
        el.sinceDate.value = range.since;
        el.untilDate.value = range.until;
      });
      el.quickThisWeek.addEventListener('click', () => {
        const range = DateUtil.getCurrentWeekRange();
        el.sinceDate.value = range.since;
        el.untilDate.value = range.until;
      });
      el.quickLastWeek.addEventListener('click', () => {
        const range = DateUtil.getLastWeekRange();
        el.sinceDate.value = range.since;
        el.untilDate.value = range.until;
      });

      // Test connection
      el.testBtn.addEventListener('click', async () => {
        const config = this.getFormConfig();
        GitLabApi.init(config.gitlabUrl, config.token);
        this.setStatus('正在测试...', 'yellow');
        this.setStatusDetail('');
        try {
          const user = await GitLabApi.getCurrentUser();
          this.setStatus('连接成功', 'green');
          this.setStatusDetail(`${user.name} (@${user.username}) — ${config.gitlabUrl}`);
        } catch (e) {
          this.setStatus('连接失败', 'red');
          this.setStatusDetail(e.message);
        }
      });

      // Generate
      el.generateBtn.addEventListener('click', async () => {
        if (this._callbacks.onGenerate) {
          await this._callbacks.onGenerate();
        }
      });

      // Stop
      el.stopBtn.addEventListener('click', () => {
        if (this._callbacks.onStop) {
          this._callbacks.onStop();
        }
      });

      // Clear
      el.clearBtn.addEventListener('click', () => {
        this.setOutput('');
        this.setStats(null);
        this.clearLog();
        this._currentRawData = null;
      });

      // Copy
      el.copyBtn.addEventListener('click', async () => {
        const text = this.getOutput();
        if (!text) {
          this.showToast('没有可复制的内容', 'error');
          return;
        }
        const ok = await Download.copyText(text);
        this.showToast(ok ? '已复制到剪贴板' : '复制失败', ok ? 'success' : 'error');
      });

      // Download MD
      el.downloadMdBtn.addEventListener('click', () => {
        const text = this.getOutput();
        if (!text) {
          this.showToast('没有可下载的内容', 'error');
          return;
        }
        const data = this._currentRawData;
        const filename = Download.makeFilename(
          data ? data.user : null,
          data ? data.range : null,
          'md'
        );
        Download.downloadFile(filename, text, 'text/markdown;charset=utf-8');
        this.showToast(`已下载 ${filename}`, 'success');
      });

      // Download JSON
      el.downloadJsonBtn.addEventListener('click', () => {
        const data = this._currentRawData;
        if (!data) {
          this.showToast('请先生成 Markdown', 'error');
          return;
        }
        // Remove sensitive data
        const safeData = { ...data };
        const filename = Download.makeFilename(data.user, data.range, 'raw.json');
        Download.downloadFile(filename, JSON.stringify(safeData, null, 2), 'application/json');
        this.showToast(`已下载 ${filename}`, 'success');
      });

      // Save settings
      el.saveSettingsBtn.addEventListener('click', () => {
        const config = this.getFormConfig();
        Config.save(config);
        this.showToast('设置已保存', 'success');
      });

      // Reset settings
      el.resetSettingsBtn.addEventListener('click', () => {
        const config = Config.reset();
        this.setFormConfig(config);
        const defaultRange = DateUtil.getRecentDaysRange(7);
        el.sinceDate.value = defaultRange.since;
        el.untilDate.value = defaultRange.until;
        this.showToast('已恢复默认设置', 'success');
      });
    },

    setRawData(data) {
      this._currentRawData = data;
    },
  };

  // =========================================================================
  // 9. Main Bootstrap
  // =========================================================================

  function main() {
    // Don't run in iframes
    if (window !== window.top) return;

    // Avoid double injection
    if (document.getElementById('glwr-float-btn')) return;

    try {
      console.log('[GLWR] GitLab 周报助手正在加载...');

      // Load config
      const config = Config.load();

      // Inject UI
      DrawerUI.inject(config);

      // Bind events
      DrawerUI.bindEvents({
      onGenerate: async () => {
        const formConfig = DrawerUI.getFormConfig();

        // Validate dates
        if (!formConfig.sinceDate || !formConfig.untilDate) {
          DrawerUI.showToast('请选择时间范围', 'error');
          return;
        }
        if (formConfig.sinceDate > formConfig.untilDate) {
          DrawerUI.showToast('开始日期不能晚于结束日期', 'error');
          return;
        }

        // Save config
        Config.save(formConfig);

        // Setup abort controller
        const abortController = new AbortController();
        DrawerUI._abortController = abortController;
        GitLabApi.setAbortController(abortController);

        // UI state
        DrawerUI.setLoading(true);
        DrawerUI.clearLog();
        DrawerUI.setOutput('');
        DrawerUI.setStats(null);

        const onLog = (msg, isError) => DrawerUI.appendLog(msg, isError);

        try {
          onLog('开始生成周报...');
          onLog(`时间范围：${formConfig.sinceDate} ~ ${formConfig.untilDate}`);
          onLog(`时区：${formConfig.timezone}`);

          const rawData = await Collector.collectAll(formConfig, onLog);

          // Check if aborted
          if (abortController.signal.aborted) {
            onLog('已停止生成');
            return;
          }

          onLog('正在生成 Markdown...');
          const markdown = Renderer.renderMarkdown(rawData);

          DrawerUI.setOutput(markdown);
          DrawerUI.setStats(rawData.stats);
          DrawerUI.setRawData(rawData);

          onLog(`生成完成！MR: ${rawData.stats.mrCount}, MR Commits: ${rawData.stats.mrCommitCount}, Direct Commits: ${rawData.stats.directCommitCount}`);

          if (rawData.warnings.length > 0) {
            onLog(`⚠ 有 ${rawData.warnings.length} 个警告，请查看上方日志。`);
          }
        } catch (e) {
          if (e.name === 'AbortError') {
            onLog('已停止生成');
          } else {
            onLog(`错误：${e.message}`, true);
            DrawerUI.showToast(`生成失败：${e.message.substring(0, 50)}`, 'error');
          }
        } finally {
          DrawerUI.setLoading(false);
          GitLabApi.setAbortController(null);
        }
      },

      onStop: () => {
        if (DrawerUI._abortController) {
          DrawerUI._abortController.abort();
        }
      },
    });

    // Register menu command
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('打开周报助手', () => DrawerUI.open());
    }

    console.log('[GLWR] GitLab 周报助手加载完成');
    } catch (e) {
      console.error('[GLWR] 初始化失败：', e);
    }
  }

  // Run
  main();
})();
