# Design Specification - Adding Logo to READMEs

This design specification details the integration of the KapitBizPH logo into both repository README files (root and web).

## Objective
To enhance the visual presentation and branding of the KapitBizPH codebase by adding the official logo (`kapitlogo.png`) at the top of the root `README.md` and the `web/README.md`.

## Proposed Design
Following the approved Centered Brand Header approach, the logo will be centered at the top of each README file with a controlled display width of 400px.

### 1. Root README (`README.md`)
We will add the following block at the very top of [README.md](file:///Users/ryandeniega/repos/Repo/hackathontagum/README.md):
```html
<p align="center">
  <img src="web/public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
</p>

# KapitBiz Relay
```

### 2. Web README (`web/README.md`)
We will add the following block at the very top of [web/README.md](file:///Users/ryandeniega/repos/Repo/hackathontagum/web/README.md):
```html
<p align="center">
  <img src="public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
</p>

# KapitBiz Relay
```

## Verification Plan
1. Render both README files locally in a Markdown previewer or check the layout formatting.
2. Confirm the relative paths to the logo correctly resolve in their respective contexts.
