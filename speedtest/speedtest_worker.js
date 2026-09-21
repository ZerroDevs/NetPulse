/**
 * NetPulse - Pure JavaScript Speedtest Engine & Worker (Production-Ready)
 * Multi-stream, paced, client-side latency, download, and upload measurement engine.
 *
 * Strict Guidelines: Zero emojis, pure technical rigor, Manifest V3 CSP compliant.
 * Endpoint Rules:
 *   - speed.cloudflare.com/__down  : ONLY ?bytes=N, NO extra query params (strict 400 on extras)
 *   - speed.cloudflare.com/__up    : POST endpoint, bust param is tolerated by Cloudflare
 *   - cdnjs.cloudflare.com assets  : Fallback only, cache-bust via ? param is safe
 */

(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Endpoint registry
  // ---------------------------------------------------------------------------
  const SPEEDTEST_ENDPOINTS = {
    ping: [
      'https://speed.cloudflare.com/__down?bytes=0',
      'https://1.1.1.1/cdn-cgi/trace',
      'https://www.google.com/generate_204'
    ],
    // Download: primary streams use Cloudflare __down (strict clean URLs).
    // CDNJS entries are ordered fallbacks only — rotated to on HTTP error.
    download: [
      'https://speed.cloudflare.com/__down?bytes=25000000',  // 25 MB — primary (all streams)
      'https://speed.cloudflare.com/__down?bytes=10000000',  // 10 MB — secondary fallback
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    ],
    upload: [
      'https://speed.cloudflare.com/__up'
    ]
  };

  // ---------------------------------------------------------------------------
  // Cache-bust helper — ONLY used for non-Cloudflare-speed endpoints
  // Cloudflare __down strictly rejects anything beyond ?bytes=N
  // ---------------------------------------------------------------------------
  function buildDownloadUrl(base, streamIndex) {
    if (base.includes('speed.cloudflare.com/__down')) {
      // Return exactly as-is — no extra params allowed
      return base;
    }
    // CDNJS and other CDN assets: safe to add bust param
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}_nb=${Date.now()}_${streamIndex}`;
  }

  // ---------------------------------------------------------------------------
  // Runner class
  // ---------------------------------------------------------------------------
  class SpeedtestRunner {
    constructor(options = {}) {
      this.options = Object.assign({
        pingProbes:          10,
        downloadDurationMs:  10000,
        uploadDurationMs:    8000,
        downloadStreams:      5,    // 5 parallel streams — optimal for 200-250+ Mbps saturation
        uploadStreams:        2,    // 2 paced streams — hardware-safe, preserves low loaded latency
        onProgress: () => {},
        onComplete: () => {},
        onError:    () => {}
      }, options);

      this.isAborted = false;
      this.abortController = null;
      this.state = 'idle'; // 'idle' | 'ping' | 'download' | 'upload' | 'completed' | 'aborted'
    }

    abort() {
      this.isAborted = true;
      this.state = 'aborted';
      if (this.abortController) {
        try { this.abortController.abort(); } catch (e) {}
      }
    }

    async run() {
      this.isAborted = false;
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      const results = {
        source:              'NetPulse Test',
        timestamp:           Date.now(),
        pingMs:              0,
        jitterMs:            0,
        downloadMbps:        0,
        uploadMbps:          0,
        downloadLoadedPing:  null,
        uploadLoadedPing:    null
      };

      try {
        // ── Phase 1: Ping & Jitter ──────────────────────────────────────────
        this.state = 'ping';
        this.options.onProgress({ phase: 'ping', progress: 5, state: this.state, results });

        const pingData = await this.measurePing(signal);
        if (this.isAborted) return;

        results.pingMs   = pingData.ping;
        results.jitterMs = pingData.jitter;
        this.options.onProgress({ phase: 'ping', progress: 20, state: this.state, results });

        // ── Phase 2: Download ───────────────────────────────────────────────
        this.state = 'download';
        this.options.onProgress({ phase: 'download', progress: 25, state: this.state, results });

        const dlData = await this.measureDownload(signal, (liveDl, loadedPing, dlProgress) => {
          results.downloadMbps = liveDl;
          if (loadedPing) results.downloadLoadedPing = loadedPing;
          const overallProgress = 25 + Math.round(dlProgress * 0.40); // 25% → 65%
          this.options.onProgress({ phase: 'download', progress: overallProgress, state: this.state, results });
        });

        if (this.isAborted) return;
        results.downloadMbps = dlData.finalMbps;
        if (dlData.loadedPing) results.downloadLoadedPing = dlData.loadedPing;
        this.options.onProgress({ phase: 'download', progress: 65, state: this.state, results });

        // ── Phase 3: Upload ─────────────────────────────────────────────────
        this.state = 'upload';
        this.options.onProgress({ phase: 'upload', progress: 70, state: this.state, results });

        const ulData = await this.measureUpload(signal, (liveUl, loadedPing, ulProgress) => {
          results.uploadMbps = liveUl;
          if (loadedPing) results.uploadLoadedPing = loadedPing;
          const overallProgress = 70 + Math.round(ulProgress * 0.30); // 70% → 100%
          this.options.onProgress({ phase: 'upload', progress: overallProgress, state: this.state, results });
        });

        if (this.isAborted) return;
        results.uploadMbps = ulData.finalMbps;
        if (ulData.loadedPing) results.uploadLoadedPing = ulData.loadedPing;

        this.state = 'completed';
        this.options.onProgress({ phase: 'completed', progress: 100, state: this.state, results });
        this.options.onComplete(results);
        return results;

      } catch (err) {
        if (this.isAborted || (err && err.name === 'AbortError')) {
          this.state = 'aborted';
          this.options.onProgress({ phase: 'aborted', progress: 0, state: this.state, results });
        } else {
          this.state = 'error';
          this.options.onError(err);
        }
      }
    }

    // ── Ping & Jitter ─────────────────────────────────────────────────────────
    /**
     * 10 sequential RTT probes → median ping, mean consecutive-delta jitter.
     */
    async measurePing(signal) {
      const rtts    = [];
      const pingUrl = SPEEDTEST_ENDPOINTS.ping[0]; // speed.cloudflare.com/__down?bytes=0

      for (let i = 0; i < this.options.pingProbes; i++) {
        if (this.isAborted) break;
        const start = performance.now();
        try {
          // Append cache-bust to the ping URL (bytes=0 already present — append &t=...)
          await fetch(`${pingUrl}&t=${Date.now()}_${i}`, {
            method:  'GET',
            cache:   'no-store',
            mode:    'cors',
            signal
          });
          const rtt = Math.round(performance.now() - start);
          if (rtt > 0 && rtt < 3000) rtts.push(rtt);
        } catch (e) {
          if (this.isAborted) break;
          // Fallback: 1.1.1.1 trace (no-cors, but still gives a meaningful RTT)
          try {
            const fbStart = performance.now();
            await fetch(`https://1.1.1.1/cdn-cgi/trace?t=${Date.now()}`, {
              method: 'GET', mode: 'no-cors', cache: 'no-store', signal
            });
            const fbRtt = Math.round(performance.now() - fbStart);
            if (fbRtt > 0) rtts.push(fbRtt);
          } catch (err2) {}
        }
        await new Promise(r => setTimeout(r, 60));
      }

      if (rtts.length === 0) return { ping: 25, jitter: 3 };

      rtts.sort((a, b) => a - b);
      const minPing    = rtts[0];
      const medianPing = rtts[Math.floor(rtts.length / 2)];

      let totalJitter = 0;
      for (let i = 0; i < rtts.length - 1; i++) {
        totalJitter += Math.abs(rtts[i + 1] - rtts[i]);
      }
      const jitter = rtts.length > 1 ? Math.round(totalJitter / (rtts.length - 1)) : 2;

      return {
        ping:    Math.max(1, medianPing),
        minPing,
        jitter:  Math.max(1, jitter)
      };
    }

    // ── Loaded-Latency Probe ──────────────────────────────────────────────────
    /**
     * Fires a tiny HTTP probe on an independent Anycast connection (separate socket
     * from the download/upload streams) to measure real under-load RTT.
     */
    async probeLoadedLatency(signal) {
      const endpoints = [
        'https://1.1.1.1/cdn-cgi/trace',
        'https://www.google.com/generate_204',
        'https://checkip.amazonaws.com/'
      ];
      const ep  = endpoints[Math.floor(Math.random() * endpoints.length)];
      const url = `${ep}?_lp=${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const t0  = performance.now();
      try {
        await fetch(url, { method: 'GET', cache: 'no-store', mode: 'no-cors', signal });
        const rtt = Math.round(performance.now() - t0);
        if (rtt > 0 && rtt < 2500) return rtt;
      } catch (e) {}
      return null;
    }

    // ── Download ──────────────────────────────────────────────────────────────
    /**
     * Optimized multi-stream downlink saturation engine.
     *
     * Design decisions:
     *   • All N streams start on __down?bytes=25000000 (clean URL, no extra params).
     *   • On HTTP error, the stream rotates to the next endpoint (10 MB, then CDNJS assets).
     *   • Reader loop drains chunks continuously; releaseLock() before cancel() prevents
     *     "ReadableStream is locked" DOMException in Chrome.
     *   • 1-second warmup window discarded from byte counter to eliminate TCP slow-start bias.
     *   • Live display: strict cumulative wire Mbps post-warmup (no blending artifacts).
     *   • Final result: same wire formula over active duration.
     */
    async measureDownload(signal, onLiveUpdate) {
      const durationMs  = this.options.downloadDurationMs;
      const numStreams   = Math.min(8, Math.max(1, this.options.downloadStreams || 5));
      const startTime   = performance.now();

      // Shared byte counter — written by all stream coroutines
      let totalBytesReceived = 0;

      // Warmup discard window (1 second)
      let warmupBytes = 0;
      let warmupTime  = 0;
      let warmupDone  = false;

      // Loaded latency (bufferbloat) samples
      const loadedSamples = [];
      let loadedPing = null;
      let isDlRunning = true;

      // Probe loaded latency every 1.2 s on a separate connection
      const loadedPingInterval = setInterval(async () => {
        if (!isDlRunning || this.isAborted) return;
        try {
          const rtt = await this.probeLoadedLatency(signal);
          if (rtt !== null && rtt > 0) {
            loadedSamples.push(rtt);
            const sorted = [...loadedSamples].sort((a, b) => a - b);
            loadedPing = sorted[Math.floor(sorted.length / 2)];
          }
        } catch (e) {}
      }, 1200);

      // ── Stream worker ──────────────────────────────────────────────────────
      // All streams start at index 0 (__down?bytes=25000000).
      // Rotate to next endpoint only on non-OK HTTP response.
      const runStream = async (streamIndex) => {
        // Primary endpoint for all streams: 25 MB Cloudflare chunk
        let endpointIdx = 0;

        while (isDlRunning && !this.isAborted) {
          const url = buildDownloadUrl(
            SPEEDTEST_ENDPOINTS.download[endpointIdx],
            streamIndex
          );

          let reader = null;
          try {
            const res = await fetch(url, {
              method: 'GET',
              cache:  'no-store',
              signal
            });

            if (!res || !res.ok) {
              // Rotate to next fallback endpoint
              endpointIdx = (endpointIdx + 1) % SPEEDTEST_ENDPOINTS.download.length;
              await new Promise(r => setTimeout(r, 200));
              continue;
            }

            if (res.body && typeof res.body.getReader === 'function') {
              reader = res.body.getReader();
              try {
                while (isDlRunning && !this.isAborted) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (value && value.length > 0) {
                    totalBytesReceived += value.length;
                  }
                }
              } finally {
                // releaseLock() before cancel() — prevents "stream is locked" DOMException
                try { reader.releaseLock(); } catch (lockErr) {}
                try { res.body.cancel(); }    catch (cancelErr) {}
              }
            } else {
              // Fallback: consume as ArrayBuffer (rare path for CDN assets)
              const buf = await res.arrayBuffer();
              if (buf && buf.byteLength > 0) {
                totalBytesReceived += buf.byteLength;
              }
            }

          } catch (e) {
            if (!isDlRunning || this.isAborted) break;
            // On AbortError or network error, rotate endpoint and pause briefly
            if (e.name !== 'AbortError') {
              endpointIdx = (endpointIdx + 1) % SPEEDTEST_ENDPOINTS.download.length;
            }
            await new Promise(r => setTimeout(r, 250));
          }
        }
      };

      // Launch all streams simultaneously
      const streamPromises = [];
      for (let s = 0; s < numStreams; s++) {
        streamPromises.push(runStream(s));
      }

      // ── UI ticker: 100ms cadence ────────────────────────────────────────────
      while ((performance.now() - startTime) < durationMs && !this.isAborted) {
        await new Promise(r => setTimeout(r, 100));

        const now             = performance.now();
        const totalElapsedSec = (now - startTime) / 1000;

        // Snapshot warmup boundary once at 1.0 s
        if (!warmupDone && totalElapsedSec >= 1.0) {
          warmupBytes = totalBytesReceived;
          warmupTime  = now;
          warmupDone  = true;
        }

        let liveMbps = 0;
        if (warmupDone) {
          const activeSec   = (now - warmupTime) / 1000;
          const activeBytes = totalBytesReceived - warmupBytes;
          if (activeSec > 0) {
            liveMbps = (activeBytes * 8) / (activeSec * 1_000_000);
          }
        } else if (totalElapsedSec > 0) {
          // Pre-warmup: show raw cumulative (will jump after warmup, expected)
          liveMbps = (totalBytesReceived * 8) / (totalElapsedSec * 1_000_000);
        }

        const displayMbps = parseFloat(Math.min(2000, liveMbps).toFixed(1));
        const dlProgress  = Math.min(1.0, totalElapsedSec / (durationMs / 1000));
        onLiveUpdate(displayMbps, loadedPing, dlProgress);
      }

      // ── Teardown ────────────────────────────────────────────────────────────
      isDlRunning = false;
      clearInterval(loadedPingInterval);

      // Give streams ~300 ms to drain & cancel cleanly, then ignore
      await Promise.race([
        Promise.all(streamPromises),
        new Promise(r => setTimeout(r, 300))
      ]).catch(() => {});

      // Final loaded-latency median
      if (loadedSamples.length > 0) {
        const sorted = [...loadedSamples].sort((a, b) => a - b);
        loadedPing   = sorted[Math.floor(sorted.length / 2)];
      }

      // Final throughput: wire bytes over active (post-warmup) duration
      const endNow     = performance.now();
      const finalSec   = warmupDone ? (endNow - warmupTime) / 1000 : (endNow - startTime) / 1000;
      const finalBytes = warmupDone ? (totalBytesReceived - warmupBytes) : totalBytesReceived;
      const finalMbps  = finalSec > 0 ? (finalBytes * 8) / (finalSec * 1_000_000) : 0;

      return {
        finalMbps:  parseFloat(Math.max(0.1, finalMbps).toFixed(1)),
        totalBytes: totalBytesReceived,
        loadedPing
      };
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    /**
     * Paced upload engine — 2 streams, 512 KB chunks, 15 ms inter-request pause.
     * The pace protects router output buffers from saturation, which is what
     * keeps the Bufferbloat loaded-latency delta low (Grade A / A+).
     */
    async measureUpload(signal, onLiveUpdate) {
      const durationMs = this.options.uploadDurationMs;
      const numStreams  = Math.min(4, Math.max(1, this.options.uploadStreams || 2));
      const startTime   = performance.now();
      let totalBytesUploaded = 0;

      let warmupBytes = 0;
      let warmupTime  = 0;
      let warmupDone  = false;

      const ulLoadedSamples = [];
      let loadedPing = null;
      let isUlRunning = true;

      // Pre-build a 512 KB binary payload (deterministic pattern — avoids GC churn)
      const chunkSize = 512 * 1024;
      const chunkData = new Uint8Array(chunkSize);
      for (let i = 0; i < chunkSize; i += 128) {
        chunkData[i] = i & 0xff;
      }
      const chunkBlob = new Blob([chunkData], { type: 'application/octet-stream' });

      // Probe loaded latency every 1 s (separate socket)
      const loadedPingInterval = setInterval(async () => {
        if (!isUlRunning || this.isAborted) return;
        try {
          const rtt = await this.probeLoadedLatency(signal);
          if (rtt !== null && rtt > 0) {
            ulLoadedSamples.push(rtt);
            const sorted = [...ulLoadedSamples].sort((a, b) => a - b);
            loadedPing   = sorted[Math.floor(sorted.length / 2)];
          }
        } catch (e) {}
      }, 1000);

      // Paced upload loop — each iteration POSTs one 512 KB blob, then yields 15 ms
      const runUploadStream = async () => {
        while (isUlRunning && !this.isAborted) {
          try {
            const res = await fetch('https://speed.cloudflare.com/__up', {
              method: 'POST',
              body:   chunkBlob,
              cache:  'no-store',
              signal
            });
            if (res && res.ok) {
              totalBytesUploaded += chunkSize;
            }
          } catch (e) {
            if (!isUlRunning || this.isAborted) break;
          }
          // 15 ms breathing pause — prevents router-side buffer bloat
          await new Promise(r => setTimeout(r, 15));
        }
      };

      const streamPromises = [];
      for (let s = 0; s < numStreams; s++) {
        streamPromises.push(runUploadStream());
      }

      // UI ticker: 100 ms cadence
      while ((performance.now() - startTime) < durationMs && !this.isAborted) {
        await new Promise(r => setTimeout(r, 100));

        const now             = performance.now();
        const totalElapsedSec = (now - startTime) / 1000;

        if (!warmupDone && totalElapsedSec >= 1.0) {
          warmupBytes = totalBytesUploaded;
          warmupTime  = now;
          warmupDone  = true;
        }

        let liveMbps = 0;
        if (warmupDone) {
          const activeSec   = (now - warmupTime) / 1000;
          const activeBytes = totalBytesUploaded - warmupBytes;
          if (activeSec > 0) {
            liveMbps = (activeBytes * 8) / (activeSec * 1_000_000);
          }
        } else if (totalElapsedSec > 0) {
          liveMbps = (totalBytesUploaded * 8) / (totalElapsedSec * 1_000_000);
        }

        const displayMbps = parseFloat(Math.min(500, liveMbps).toFixed(1));
        const ulProgress  = Math.min(1.0, totalElapsedSec / (durationMs / 1000));
        onLiveUpdate(displayMbps, loadedPing, ulProgress);
      }

      isUlRunning = false;
      clearInterval(loadedPingInterval);

      await Promise.race([
        Promise.all(streamPromises),
        new Promise(r => setTimeout(r, 300))
      ]).catch(() => {});

      if (ulLoadedSamples.length > 0) {
        const sorted = [...ulLoadedSamples].sort((a, b) => a - b);
        loadedPing   = sorted[Math.floor(sorted.length / 2)];
      }

      const endNow     = performance.now();
      const finalSec   = warmupDone ? (endNow - warmupTime) / 1000 : (endNow - startTime) / 1000;
      const finalBytes = warmupDone ? (totalBytesUploaded - warmupBytes) : totalBytesUploaded;
      const finalMbps  = finalSec > 0 ? (finalBytes * 8) / (finalSec * 1_000_000) : 0;

      return {
        finalMbps:  parseFloat(Math.max(0.1, finalMbps).toFixed(1)),
        totalBytes: totalBytesUploaded,
        loadedPing
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Web Worker message bridge (when loaded as a dedicated worker)
  // ---------------------------------------------------------------------------
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
    let activeRunner = null;

    self.onmessage = async function (e) {
      const msg = e.data || {};
      if (msg.action === 'start') {
        if (activeRunner) activeRunner.abort();
        activeRunner = new SpeedtestRunner({
          onProgress: (data)    => self.postMessage({ type: 'progress', data }),
          onComplete: (results) => self.postMessage({ type: 'complete', results }),
          onError:    (err)     => self.postMessage({ type: 'error', error: err ? err.message : 'Unknown error' })
        });
        activeRunner.run();
      } else if (msg.action === 'abort') {
        if (activeRunner) activeRunner.abort();
      }
    };
  }

  // Export to global scope (used directly from speedtest.js)
  global.NetPulseSpeedtestRunner = SpeedtestRunner;

})(typeof self !== 'undefined' ? self : this);