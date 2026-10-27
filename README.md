# Vinay Sai Kothuri — Portfolio

Portfolio of a Microsoft Dynamics 365 Business Central / Navision Functional Consultant.

[Visit the portfolio](https://kanna06-vs.github.io/My-Portfolio/)

## Technology

Vite, TypeScript, SCSS, GSAP, Three.js, WebGL and GLSL. The site includes automatic day/night mode, a stationary profile portrait and a responsive project showcase.

## Local development

Use Node.js 22.12 or newer and npm:

```sh
npm ci
npm run dev
```

## Deployment

GitHub Actions builds the portfolio and publishes its `dist` artifact to GitHub Pages whenever changes are pushed to `main`. The workflow can also be started manually from the Actions tab.

In repository **Settings → Pages**, the publishing source must be **GitHub Actions**.

Commit the application source, images, résumé, local fonts and their licence files. Dependencies, local build output, preview screenshots and browser profiles are excluded by `.gitignore`.
