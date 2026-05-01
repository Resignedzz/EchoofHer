---
title: 获取当前时间戳
description: 多种语言下获取当前 Unix 时间戳的方法
language: 多语言
tags:
  - 时间
  - 基础
date: 2026-04-27
---

获取当前 Unix 时间戳（秒级）：

```javascript
Math.floor(Date.now() / 1000)
```

```python
import time
int(time.time())
```

```bash
date +%s
```
