# 👋 Portfolio

![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages_Ready-F38020?logo=cloudflare&logoColor=white)
![Free](https://img.shields.io/badge/Hosting-Free-22C55E)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white)
![nginx](https://img.shields.io/badge/nginx-Alpine-009639?logo=nginx&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

A personal portfolio site served by a small, hardened **nginx** container. Friendly to run locally, ready for Kubernetes, and published automatically from CI. Cloudflare-ready, so it can be hosted for free. 🚀

**👤 Author:** Sherwin Frias
**📅 Date:** 2026-11-22

---

## ✨ Highlights

- 🪶 **Lightweight:** built on the Docker Hardened Images `nginx:1-alpine` base.
- 🔒 **Hardened:** runs as a non-root user with a read-only filesystem and no extra Linux capabilities.
- ☸️ **Kubernetes-ready:** includes a Deployment and a Service.
- 🤖 **Automated:** CI validates the config and manifests, then pushes the image to Docker Hub.
- ☁️ **Cloudflare-ready:** the static site in `site/` deploys to Cloudflare Pages on the free plan.

---

## 🗂️ Project Structure

| Path | Purpose |
| --- | --- |
| `site/` | 🌐 Everything published to the web (the Cloudflare Pages output directory) |
| `site/index.html`, `site/styles.css` | 🎨 Site content and styling |
| `site/images/`, `site/fonts/`, `site/cv.pdf` | 🖼️ Static assets |
| `nginx.conf` | ⚙️ nginx configuration (port 8080, JSON access logs, Cloudflare real-IP support) |
| `Dockerfile` | 🐳 Container image definition |
| `docker-compose.yml` | 🧩 Local run with Compose or Podman Compose |
| `kubernetes/deployment.yaml` | 📦 Kubernetes Deployment |
| `kubernetes/service.yaml` | 🔌 Kubernetes Service |
| `.github/workflows/ci.yml` | 🔁 CI pipeline |

---

## 🚀 Quick Start

### 🐳 Run with Docker or Podman Compose

```sh
docker compose up -d --build      # or: podman-compose up -d --build
```

Open <http://localhost:8080> in your browser. 🎉

### 🔍 View logs

The compose file sends logs to journald under the tag `portfolio`:

```sh
journalctl -t portfolio -f
```

---

## ☁️ Deploy to Cloudflare Pages (Free)

The site is static and **Cloudflare-ready**, so it can be hosted for free on Cloudflare Pages:

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select this repository.
2. Leave the **Build command** empty.
3. Set the **Build output directory** to `site`.
4. Deploy. Every push to `main` redeploys the site.

---

## ☸️ Deploy to Kubernetes

Apply the Deployment and Service:

```sh
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

Check that everything is healthy:

```sh
kubectl get deploy,svc,pods -l app=portfolio
```

Reach the site locally by port-forwarding:

```sh
kubectl port-forward svc/portfolio 8080:80
```

Then open <http://localhost:8080>. 🌐

> 💡 **Tip:** The Deployment uses `localhost/portfolio:local` by default. For a cluster to pull it, change the `image:` field to your Docker Hub image, such as `<your-dockerhub-username>/portfolio:latest`.

---

## 🔁 CI/CD

The workflow in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pushes to `main`:

1. 🏗️ **Build** the image.
2. ✅ **Validate** `nginx.conf` with `nginx -t`.
3. ✅ **Validate** Kubernetes manifests with kubeconform.
4. 🚢 **Push** the image to Docker Hub with the `latest` and commit-SHA tags.

### 🔐 Required repository secrets

| Secret | Description |
| --- | --- |
| `DHI_USERNAME` | 🔑 Docker Hardened Images login (`dhi.io`) |
| `DHI_TOKEN` | 🔑 Docker access token for `dhi.io` |
| `DOCKERHUB_USERNAME` | 👤 Docker Hub username (the image is pushed to `<username>/portfolio`) |
| `DOCKERHUB_TOKEN` | 🔑 Docker Hub access token with write access |

---

## 🛡️ Notes

- 🌩️ **Cloudflare:** `nginx.conf` reads the visitor's IP from `CF-Connecting-IP`, but only from Cloudflare's published IP ranges. Refresh those ranges periodically.
- ✉️ **Contact form:** The Cloudflare Worker in `worker/` verifies Turnstile and forwards submissions to Formspree. Deploy it with Wrangler from that directory and set the `TURNSTILE_SECRET` Worker secret with `wrangler secret put TURNSTILE_SECRET`. The widget must allow `portfolio.thefrias.net`; update the site key, Worker URL, and allowed origin if the deployment changes. Formspree must not be configured to verify the same Turnstile token again: tokens are single-use.
- 🔎 **Delivery troubleshooting:** A successful response means Formspree accepted the request, not that it delivered an email or kept it out of spam. Check the Formspree submissions and spam inbox, domain restriction, recipient and notification settings. The Worker forwards the permitted site origin as the referrer for Formspree's domain restriction.
- 🔄 **Base image updates:** rebuild with `docker compose build --pull` (or `docker build --pull`) to pick up the latest `dhi.io/nginx:1-alpine` base.

---

Made with 💙 and a lot of ☕.
