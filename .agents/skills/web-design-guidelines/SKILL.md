---
name: web-design-guidelines
description: Audit and enforce web design best practices, accessibility (a11y), contrast ratios, keyboard navigation, and responsive UX standards inspired by Vercel Labs.
---

# Web Design Guidelines (Vercel Labs Standard)

When developing, refactoring, or auditing UI components, enforce production-ready web design standards with a strong focus on accessibility, ergonomic usability, and performance.

## 1. Accessibility (a11y) & WCAG Compliance

* **Semantic HTML:** Always use `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, and `<section>`. Never nest non-semantic `<div>` tags where standard HTML elements exist.
* **Buttons vs Links:**
  - Use `<button>` for actions (submit, toggle, delete, open modal).
  - Use `<Link>` or `<a>` for navigation between URLs.
* **Icon-Only Buttons:** Every icon button (e.g., close icon `✕`, copy icon `📋`, hamburger menu) MUST have an explicit `aria-label="Description"` or screen-reader text `<span className="sr-only">Close</span>`.
* **Color Contrast:** Foreground text and interactive icons must maintain at least 4.5:1 contrast ratio against their background (WCAG AA). Never use low-contrast gray-on-black (`text-slate-600` on `#050a14`).

## 2. Touch Targets & Mobile Ergonomics

* **Minimum Hit Area:** All tap targets (buttons, links, form checkboxes) must be at least `44x44px` on mobile displays to prevent accidental taps.
* **Visible Focus States:** Every interactive element must have a clear keyboard focus ring (`focus-visible:ring-2 focus-visible:ring-[#00e5a0] focus-visible:outline-none`).
* **Input Auto-zoom Prevention:** Form inputs on mobile must have a font-size of at least 16px (`text-base sm:text-sm`) to prevent iOS Safari from zooming into the viewport automatically.

## 3. Performance & CSS Rules

* **No `transition: all`:** Universal transitions hurt frame rates and cause unexpected animations on layout resize. Specify explicit properties: `transition-[color,background-color,border-color,transform] duration-200`.
* **Layout Shifts (CLS):** Provide explicit width and height or aspect-ratio on all images and containers to eliminate Cumulative Layout Shift.

## 4. Copywriting & Error Handling

* **Actionable Error Messages:** Never show ambiguous messages like "Error occurred" or "Invalid input". State exactly what went wrong and how the user can resolve it (e.g., "Mã đơn hàng không tìm thấy. Vui lòng kiểm tra lại 10 ký tự mã đơn trong email của bạn.").
* **Active, Direct Voice:** Use clear, user-centric verbs on buttons ("Mua Ngay", "Sao Chép Mã", "Tải File") instead of passive terms ("OK", "Gửi đi").
