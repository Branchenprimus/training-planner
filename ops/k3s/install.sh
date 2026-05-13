#!/usr/bin/env sh
set -eu

curl -sfL https://get.k3s.io | sh -s - \
  --write-kubeconfig-mode 644

echo "k3s is installed."
echo "Try: kubectl get nodes"
