# syntax=docker/dockerfile:1.7

ARG DEPS_IMAGE=swr.cn-east-3.myhuaweicloud.com/beeize-test/auto-publish-front:deps
FROM ${DEPS_IMAGE} AS deps

FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_BACKEND_BASE_URL=""
ARG NEXT_PUBLIC_LANGGRAPH_BASE_URL="/api/langgraph"
ARG NEXT_PUBLIC_STATIC_WEBSITE_ONLY=""
ARG NEXT_PUBLIC_GEN_IMAGE_PREFIX=""

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_BACKEND_BASE_URL=${NEXT_PUBLIC_BACKEND_BASE_URL}
ENV NEXT_PUBLIC_LANGGRAPH_BASE_URL=${NEXT_PUBLIC_LANGGRAPH_BASE_URL}
ENV NEXT_PUBLIC_STATIC_WEBSITE_ONLY=${NEXT_PUBLIC_STATIC_WEBSITE_ONLY}
ENV NEXT_PUBLIC_GEN_IMAGE_PREFIX=${NEXT_PUBLIC_GEN_IMAGE_PREFIX}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/renderer/node_modules ./apps/renderer/node_modules
COPY package.json package-lock.json ./
COPY .npmrc ./.npmrc
COPY apps/renderer ./apps/renderer

RUN npm install

RUN --mount=type=cache,target=/app/apps/renderer/.next/cache \
    npm -w apps/renderer exec next build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=13200
ENV HOSTNAME=0.0.0.0

ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_BACKEND_BASE_URL=""
ARG NEXT_PUBLIC_LANGGRAPH_BASE_URL="/api/langgraph"
ARG NEXT_PUBLIC_STATIC_WEBSITE_ONLY=""
ARG NEXT_PUBLIC_GEN_IMAGE_PREFIX=""

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_BACKEND_BASE_URL=${NEXT_PUBLIC_BACKEND_BASE_URL}
ENV NEXT_PUBLIC_LANGGRAPH_BASE_URL=${NEXT_PUBLIC_LANGGRAPH_BASE_URL}
ENV NEXT_PUBLIC_STATIC_WEBSITE_ONLY=${NEXT_PUBLIC_STATIC_WEBSITE_ONLY}
ENV NEXT_PUBLIC_GEN_IMAGE_PREFIX=${NEXT_PUBLIC_GEN_IMAGE_PREFIX}

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/renderer ./apps/renderer

EXPOSE 13200

CMD ["npm", "-w", "apps/renderer", "run", "start"]
