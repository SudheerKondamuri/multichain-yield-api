# Multi-Chain DeFi Yield Aggregator API - Implementation Plan

This document outlines the milestones and steps required to complete the Yield Aggregator API project, based on the provided requirements.

## Milestone 1: Environment & Project Foundation
*Objective: Set up the fundamental configuration and orchestration for the multi-service application.*

- [ ] **Define Environment Variables**: Complete the `.env.example` file with placeholders for all three RPC URLs, Graph API keys, API port (4000), and Redis configuration.
- [ ] **Dockerize Services**:
  - Configure `Dockerfile.api` for the Express server.
  - Configure `Dockerfile.sync` for the background synchronization service.
  - Set up `docker-compose.yml` to orchestrate `api`, `sync-service`, and `redis`.
  - Add `healthcheck` configurations for all services, ensuring `api` waits for `redis` to be healthy.

## Milestone 2: Background Sync Service & Caching Layer
*Objective: Build the mechanism that runs periodically and prepares the data store.*

- [ ] **Initialize Sync Worker**: Develop `src/worker.ts` to be the entry point for the `sync-service`.
- [ ] **Implement Redis Client**: Create a connection singleton in `src/utils/redis.ts` to interact with the containerized Redis instance.
- [ ] **Set Up CRON/Interval Logic**: Configure a 5-minute (300 seconds) interval in the worker to trigger data fetching routines.
- [ ] **Implement Persistent Backup**: Add logic to write a snapshot of the fetched data to `./data/yields_cache.json` after every successful sync run.

## Milestone 3: Data Indexers Implementation
*Objective: Develop modular integrations to fetch Yield and TVL data from the blockchain/Graph.*

- [ ] **Ethereum Indexers**:
  - Aave v3 Provider (via The Graph or Viem)
  - Uniswap v3 Provider
  - Curve Finance Provider
- [ ] **Polygon Indexers**:
  - Aave v3 Provider
  - Uniswap v3 Provider
  - Curve Finance Provider
- [ ] **Arbitrum Indexers**:
  - Aave v3 Provider
  - Uniswap v3 Provider
  - Curve Finance Provider
- [ ] **Data Normalization**: Create standard interfaces (e.g., `YieldOpportunity`) so all indexers return data in the same format before saving it to Redis under keys like `yields:ethereum`, `yields:polygon`, etc.
- [ ] **Handle TTLs**: Ensure data stored in Redis has a 300-second TTL to avoid serving stale data.

## Milestone 4: REST API Implementation
*Objective: Serve the compiled data from Redis to external consumers quickly and reliably.*

- [ ] **Status Endpoint (`GET /api/chains/status`)**: Implement logic to return the `lastSync` time and `status` for Ethereum, Polygon, and Arbitrum.
- [ ] **Aggregated Yields Endpoint (`GET /api/yields`)**:
  - Retrieve data from all relevant Redis chain keys.
  - Implement filtering by `chains` (e.g., `?chains=ethereum,polygon`).
  - Implement filtering by `minAPY` (e.g., `?minAPY=10`).
- [ ] **Best Yield Endpoint (`GET /api/yields/best`)**:
  - Parse the `asset` and optional `amount` query parameters.
  - Search across all chains/protocols to find the single object with the highest APY for that specific asset.
- [ ] **API Server Setup**: Wire up Express in `src/server.ts`, add CORS and error-handling middleware.

## Milestone 5: Testing, Documentation, & Polish
*Objective: Finalize the project for submission and ensure all core requirements are strictly met.*

- [ ] **API Validation**: Manually test the API via `curl` or Postman to ensure all JSON schemas perfectly match the task requirements.
- [ ] **End-to-End Test (Docker)**: Run `docker-compose up --build` and verify the background service runs immediately and populates the cache so the API fulfills requests within the first 5 minutes.
- [ ] **Write `README.md`**: Add clear instructions on how to set environment variables, start the Docker cluster, and query the API endpoints (including examples).
- [ ] **Error Handling Check**: Verify graceful failure if an RPC endpoint drops and implement retries.
- [ ] **Cleanup**: Remove unused files, ensure no secrets are hardcoded or tracked in Git.
