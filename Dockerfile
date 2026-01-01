FROM oven/bun:1-alpine AS base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production --ignore-scripts

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun --bun run build

# Prod server
FROM base AS release
RUN apk add --no-cache iputils
WORKDIR /app
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/entrypoint.sh .
COPY --from=prerelease /app/VERSION .
COPY --from=prerelease /app/build build/
COPY --from=prerelease /app/sql sql/
COPY --from=prerelease /app/scripts scripts/
USER bun
EXPOSE 4173
CMD [ "sh", "./entrypoint.sh" ]
