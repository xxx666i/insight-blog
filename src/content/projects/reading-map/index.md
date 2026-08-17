---
slug: reading-map
title: 阅读地图
summary: 把书摘、主题和关联笔记组织成可浏览路径的小型知识地图。
publishedAt: 2025-08-24
tags:
  - 阅读
  - 工具
status: completed
featured: false
period: 2025.04 — 2025.08
role: 设计与开发
technologies:
  - Astro
  - TypeScript
draft: false
lang: zh-CN
---

阅读地图尝试解决一个简单问题：书摘越来越多以后，怎样重新找到它们之间的关系，而不是只剩下一条按时间排列的列表。

## 设计取舍

项目以主题和双向关联为核心，没有加入复杂的评分系统。每条记录都保留来源，同时允许从一个概念继续走向相关笔记。

最终版本保持纯静态输出，可以随内容一起提交到 Git，也方便长期迁移。
