#!/bin/bash

# Start all services
docker-compose up -d

# Backend development
cd backend && npm install && npm run dev &

# Frontend development
cd frontend && npm install && npm run dev &
