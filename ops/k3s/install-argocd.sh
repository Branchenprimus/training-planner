#!/usr/bin/env sh
set -eu

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server --timeout=300s
kubectl apply -f ops/argocd/root-app.yaml

echo "Argo CD is installed and the root application has been applied."
echo "Try: kubectl -n argocd port-forward svc/argocd-server 8080:443"
