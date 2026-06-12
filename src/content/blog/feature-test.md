---
title: "🧪 新功能测试：灯箱 · 流程图 · 数学公式"
description: "测试图片灯箱点击放大、Mermaid 流程图渲染、KaTeX 数学公式、访客留言等新功能"
date: 2026-06-08
tags: ["test", "feature"]
draft: false
---

## 图片灯箱测试

点击下方图片，应该弹出深色遮罩 + 放大查看。

![测试图片](https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800)

按 ESC 或点击背景关闭。

---

## Mermaid 流程图

```mermaid
graph TD
    A[开始] --> B{检查登录状态}
    B -->|已登录| C[进入主页]
    B -->|未登录| D[跳转登录页]
    C --> E[加载数据]
    D --> F[输入账号密码]
    F --> G{验证}
    G -->|成功| C
    G -->|失败| F
    E --> H[渲染页面]
    H --> I[结束]
```

---

## KaTeX 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

矩阵：

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

---

## 代码块（原有功能）

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

---

## 总结

| 功能 | 状态 |
|------|------|
| 🖼️ 图片灯箱 | ✅ 点击放大 |
| 📐 Mermaid | ✅ 流程图渲染 |
| 📝 KaTeX | ✅ 数学公式 |
| 💬 访客留言 | ✅ 免登录评论 |
