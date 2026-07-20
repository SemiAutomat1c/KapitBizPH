# KapitBizPH README Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the centered KapitBizPH logo to the top of both the root `README.md` and the `web/README.md` files.

**Architecture:** Center the logo using an HTML `<p align="center">` element with a standard visual width constraint of `400px` to maintain high-quality display layouts on GitHub and other Markdown engines.

**Tech Stack:** Markdown, HTML img tag

## Global Constraints
- Target logo path for root README: `web/public/illustrations/kapitlogo.png`
- Target logo path for web README: `public/illustrations/kapitlogo.png`
- Logo width: 400px
- Alt text: `KapitBizPH Logo`

---

### Task 1: Add Logo to Root README

**Files:**
- Modify: `README.md:1-2`

**Interfaces:**
- Consumes: None
- Produces: Visual logo at the top of the root README file

- [ ] **Step 1: Modify root README.md**
  Add the centered logo image tags above the main title heading in [README.md](file:///Users/ryandeniega/repos/Repo/hackathontagum/README.md).

  Modify:
  ```html
  <p align="center">
    <img src="web/public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
  </p>

  # KapitBiz Relay
  ```

- [ ] **Step 2: Verify git diff**
  Run: `git diff README.md`
  Expected: Logo code block appears at the top of the diff.

- [ ] **Step 3: Commit the change**
  Run: `git add README.md && git commit -m "docs: add KapitBizPH logo to root README"`
  Expected: Successful clean commit.

---

### Task 2: Add Logo to Web README

**Files:**
- Modify: `web/README.md:1-2`

**Interfaces:**
- Consumes: None
- Produces: Visual logo at the top of the web README file

- [ ] **Step 1: Modify web README.md**
  Add the centered logo image tags above the main title heading in [web/README.md](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/README.md).

  Modify:
  ```html
  <p align="center">
    <img src="public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
  </p>

  # KapitBiz Relay
  ```

- [ ] **Step 2: Verify git diff**
  Run: `git diff web/README.md`
  Expected: Logo code block appears at the top of the diff.

- [ ] **Step 3: Commit the change**
  Run: `git add web/README.md && git commit -m "docs: add KapitBizPH logo to web README"`
  Expected: Successful clean commit.
