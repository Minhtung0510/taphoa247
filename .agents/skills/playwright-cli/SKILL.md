---
name: playwright-cli
description: Control browser automation, perform token-efficient UI testing, take responsive screenshots, and test user purchase flows using Microsoft's Playwright CLI.
---

# Playwright CLI Skill

Use `playwright-cli.cmd` to automate browser interactions, inspect running web pages, test payment flows, and verify UI layouts with minimal token overhead.

## Core Command Syntax

> Note: On Windows PowerShell environments, invoke using `playwright-cli.cmd`.

### 1. Opening and Navigation
```bash
playwright-cli.cmd open http://localhost:3000
playwright-cli.cmd goto http://localhost:3000/valorant
```

### 2. Snapshot & Inspection (Token-Efficient)
Instead of extracting the full DOM tree, take a compact structural snapshot:
```bash
playwright-cli.cmd snapshot
```
Output returns an element reference map (e.g. `e1: button "Mua Ngay"`, `e2: input "Email"`, `e3: link "Bảo Hành"`).

### 3. Interacting with Elements
Interact with any element using its compact reference ID:
```bash
playwright-cli.cmd click e1
playwright-cli.cmd fill e2 "test_user@gmail.com"
playwright-cli.cmd press Enter
```

### 4. Taking Screenshots for Verification
```bash
playwright-cli.cmd screenshot --filename=screenshot-home.png
```

### 5. Mobile & Responsive Emulation
```bash
# Test Mobile Viewport (iPhone 14)
playwright-cli.cmd resize 390 844
playwright-cli.cmd screenshot --filename=mobile-view.png

# Test Laptop Viewport
playwright-cli.cmd resize 1366 768
```

### 6. Session Teardown
```bash
playwright-cli.cmd close
```
