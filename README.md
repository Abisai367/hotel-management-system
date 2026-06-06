# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Running the app with PHP backend

This project includes a PHP backend under `api/`. The full app requires a PHP server and MySQL database.

- Use XAMPP, WAMP, or another PHP host.
- Serve the React build from the same server or set `VITE_API_URL` to the backend URL.
- Do not rely on GitHub Pages for the PHP API because GitHub Pages cannot execute PHP.

Example local backend URL:

```bash
VITE_API_URL=http://localhost/hotel%20management%20system/api
```

Then build and deploy the React app with:

```bash
npm run build
```
```