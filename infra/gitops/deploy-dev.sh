#!/bin/bash

cd infra/gitops/kustomize/overlays/development
kustomize build . | kubectl apply -f -
