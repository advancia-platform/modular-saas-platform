#!/bin/bash

cd infra/gitops/kustomize/overlays/production
kustomize build . | kubectl apply -f -
