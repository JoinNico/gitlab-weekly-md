## 使用方法

安装依赖：

```bash
pip3 install requests
```

配置环境变量：

```bash
export GITLAB_URL="http://gitlab.intchains.in:9000"
export GITLAB_TOKEN="你的 GitLab Access Token"
export GITLAB_USERNAME="yunhao.gu"
```

先跑最近 7 天：

```bash
python3 gitlab_weekly_md.py --days 7
```

指定本周时间：

```bash
python3 gitlab_weekly_md.py \
  --since 2026-06-29 \
  --until 2026-07-03 \
  --output weekly_gitlab_report.md
```

如果你已经知道重点仓库的 project id，建议手动指定：

```bash
export GITLAB_PROJECT_IDS="123,456,789"

python3 gitlab_weekly_md.py --since 2026-06-29 --until 2026-07-03
```

GitLab REST API 默认分页，`per_page` 最大 100，返回多页时要继续读取 `X-Next-Page`，所以脚本里已经处理了分页。([GitLab Docs][1])

---

## 这版脚本第一阶段能解决什么

它生成的不是最终周报，而是：

```text
weekly_gitlab_report.md
```

这个文件是给 AI 的原始材料，里面会包含：

```text
1. 本周 MR
2. MR 关联 commits
3. 本周 direct commits
4. 给 AI 的周报生成提示词
```

你后面直接把这个 md 丢给 AI，让它总结成：

```text
本周完成：
- xxx

问题修复：
- xxx

进行中：
- xxx

下周计划：
- xxx
```

第一版就按这个做，够用了。后面再加两个功能会更像“大厂周报助手”：

```text
1. commit type 分类：
   feat / fix / chore / docs / refactor

2. 项目关键词映射：
   tps-imager → 镜像烧录工具
   tps-tools → SDK 工具打包
   modemmanager → 蜂窝模组/网络服务
   kernel → 底层驱动/系统稳定性
```
