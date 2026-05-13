# k3s and Argo CD

This directory contains a small GitOps setup for running Training Planner on a k3s cluster and managing it with Argo CD.

## Layout

- `k3s/`: one-time bootstrap scripts for k3s and Argo CD.
- `argocd/root-app.yaml`: the app-of-apps entry point.
- `argocd/apps/`: Argo CD `Application` objects managed by the root app.
- `apps/training-planner/`: Kubernetes manifests for this application.

## 1. Install k3s

Run this on the server that should host the cluster:

```bash
ops/k3s/install.sh
```

k3s installs Traefik and the `local-path` storage class by default. The manifests here use both, so a single-node home-server install works without extra add-ons.

## 2. Build and publish the app image

Build this repository into an image and push it to a registry your cluster can pull from:

```bash
docker build -t ghcr.io/YOUR_GITHUB_USER/training-planner:latest .
docker push ghcr.io/YOUR_GITHUB_USER/training-planner:latest
```

Then update `ops/apps/training-planner/overlays/prod/kustomization.yaml` with the real image name and tag.

## 3. Configure app secrets

Create a real secret manifest from the example:

```bash
cp ops/apps/training-planner/overlays/prod/secret.example.yaml ops/apps/training-planner/overlays/prod/secret.yaml
```

Fill in the Strava credentials and session secret. `secret.yaml` is ignored by git.

Apply it once outside Argo CD:

```bash
kubectl apply -f ops/apps/training-planner/overlays/prod/secret.yaml
```

For a fully GitOps-managed setup, replace this local secret with a Sealed Secret, External Secrets, or SOPS-encrypted secret and add that encrypted resource to the production kustomization.

## 4. Configure Argo CD

Replace `REPLACE_WITH_YOUR_GIT_REPO_URL` in these files with this repository's clone URL:

- `ops/argocd/root-app.yaml`
- `ops/argocd/apps/training-planner.yaml`

Then install Argo CD and apply the root app:

```bash
ops/k3s/install-argocd.sh
```

## 5. First sync

Open the Argo CD UI:

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Get the initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

Then visit `https://localhost:8080`, log in as `admin`, and sync the root application.

## 6. Production domain

The production ingress is configured for `sports.example.com`. Change the host in:

```text
ops/apps/training-planner/overlays/prod/ingress.yaml
```

Also update `APP_ORIGIN` and `NUXT_STRAVA_REDIRECT_URI` in:

```text
ops/apps/training-planner/overlays/prod/configmap.yaml
```
