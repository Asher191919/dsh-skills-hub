/**
 * Skills Hub — the provider seam.
 *
 * A provider adapts one upstream registry to one shape the aggregation layer
 * understands. Providers never see HTTP status codes, cache policy, or install
 * state: they return normalized skills or throw a
 * {@link MarketUpstreamError}, and one provider failing never affects another.
 *
 * @module dsh-skills-hub/host/provider
 */
export {};
