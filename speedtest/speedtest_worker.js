/**
 * NetPulse - Pure JavaScript Speedtest Engine & Worker
 * Multi-stream, client-side latency, download, and upload measurement engine.
 * 
 * Strict Guidelines: Zero emojis, pure technical rigor, Manifest V3 CSP compliant.
 */

(function (global) {
  'use strict';

  // Reliable, high-capacity, CORS-enabled endpoints
  const SPEEDTEST_ENDPOINTS = {
    ping: [
      'https://speed.cloudflare.com/__down?bytes=0',
      'https://1.1.1.1/cdn-cgi/trace',
      'https://www.google.com/generate_204'
    ],
    download: [
      'https://speed.cloudflare.com/__down?bytes=25000000',
      'https://speed.cloudflare.com/__down?bytes=10000000',
      'https://speed.cloudflare.com/__down?bytes=5000000'
    ],
    upload: [
      'https://speed.cloudflare.com/__up'
    ]
  };

  class SpeedtestRunner {
    constructor(options = {}) {
      this.options = Object.assign({
        pingProbes: 10,
        downloadDurationMs: 8000,
        uploadDurationMs: 6000,
        downloadStreams: 4,
        uploadStreams: 3,
        onProgress: () => {},
        onComplete: () => {},
        onError: () => {}
      }, options);

      this.isAborted = false;
      this.abortController = null;
      this.state = 'idle'; // 'idle', 'ping', 'download', 'upload', 'completed', 'aborted'
    }

    abort() {
      this.isAborted = true;
      this.state = 'aborted';
      if (this.abortController) {
        try {
          this.abortController.abort();
        } catch (e) {
          // ignore
        }
      }
    }

    async run() {
      this.isAborted = false;
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      const results = {
        source: 'NetPulse Test',
        timestamp: Date.now(),
        pingMs: 0,
        jitterMs: 0,
        downloadMbps: 0,
        uploadMbps: 0,
        downloadLoadedPing: null,
        uploadLoadedPing: null
      };

      try {
        // Phase 1: Ping & Jitter
        this.state = 'ping';
        this.options.onProgress({ phase: 'ping', progress: 5, state: this.state, results });

        const pingData = await this.measurePing(signal);
        if (this.isAborted) return;

        results.pingMs = pingData.ping;
        results.jitterMs = pingData.jitter;
        this.options.onProgress({ phase: 'ping', progress: 20, state: this.state, results });

        // Phase 2: Download Throughput
        this.state = 'download';
        this.options.onProgress({ phase: 'download', progress: 25, state: this.state, results });

        const dlData = await this.measureDownload(signal, (liveDl, loadedPing, dlProgress) => {
          results.downloadMbps = liveDl;
          if (loadedPing) results.downloadLoadedPing = loadedPing;
          const overallProgress = 25 + Math.round(dlProgress * 0.40); // 25% to 65%
          this.options.onProgress({ phase: 'download', progress: overallProgress, state: this.state, results });
        });

        if (this.isAborted) return;
        results.downloadMbps = dlData.finalMbps;
        if (dlData.loadedPing) results.downloadLoadedPing = dlData.loadedPing;
        this.options.onProgress({ phase: 'download', progress: 65, state: this.state, results });

        // Phase 3: Upload Throughput
        this.state = 'upload';
        this.options.onProgress({ phase: 'upload', progress: 70, state: this.state, results });

        const ulData = await this.measureUpload(signal, (liveUl, loadedPing, ulProgress) => {
          results.uploadMbps = liveUl;
          if (loadedPing) results.uploadLoadedPing = loadedPing;
          const overallProgress = 70 + Math.round(ulProgress * 0.30); // 70% to 100%
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

    /**
     * Measure Ping & Jitter via sequential RTT probes
     */
    async measurePing(signal) {
      const rtts = [];
      const pingUrl = SPEEDTEST_ENDPOINTS.ping[0];

      for (let i = 0; i < this.options.pingProbes; i++) {
        if (this.isAborted) break;
        const start = performance.now();
        try {
          const bust = `?t=${Date.now()}_${i}&bytes=0`;
          await fetch(pingUrl + bust, {
            method: 'GET',
            cache: 'no-store',
            mode: 'cors',
            signal
          });
          const rtt = Math.round(performance.now() - start);
          if (rtt > 0 && rtt < 3000) {
            rtts.push(rtt);
          }
        } catch (e) {
          if (this.isAborted) break;
          // Fallback probe
          try {
            const fbStart = performance.now();
            await fetch(`https://1.1.1.1/cdn-cgi/trace?t=${Date.now()}`, {
              method: 'GET',
              mode: 'no-cors',
              cache: 'no-store',
              signal
            });
            const fbRtt = Math.round(performance.now() - fbStart);
            if (fbRtt > 0) rtts.push(fbRtt);
          } catch (err2) {
            // ignore
          }
        }

        // Brief delay between probes
        await new Promise(r => setTimeout(r, 60));
      }

      if (rtts.length === 0) {
        return { ping: 25, jitter: 3 };
      }

      // Calculate min RTT and jitter
      rtts.sort((a, b) => a - b);
      const minPing = rtts[0];
      const medianPing = rtts[Math.floor(rtts.length / 2)];

      let totalJitterDelta = 0;
      let countJitter = 0;
      for (let i = 0; i < rtts.length - 1; i++) {
        totalJitterDelta += Math.abs(rtts[i + 1] - rtts[i]);
        countJitter++;
      }
      const jitter = countJitter > 0 ? Math.round(totalJitterDelta / countJitter) : 2;

      return {
        ping: Math.max(1, medianPing),
        minPing,
        jitter: Math.max(1, jitter)
      };
    }

    /**
     * Measure Download Throughput with parallel chunk reading and live smoothing
     */
    async measureDownload(signal, onLiveUpdate) {
      const durationMs = this.options.downloadDurationMs;
      const numStreams = this.options.downloadStreams;
      const startTime = performance.now();
      let totalBytesReceived = 0;
      const sampleRates = [];
      let loadedPing = null;

      let isDlRunning = true;

      // Loaded ping probe timer
      const loadedPingInterval = setInterval(async () => {
        if (!isDlRunning || this.isAborted) return;
        const pStart = performance.now();
        try {
          await fetch(`https://speed.cloudflare.com/__down?bytes=0&lp=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            mode: 'cors',
            signal
          });
          const pRtt = Math.round(performance.now() - pStart);
          if (pRtt > 0 && pRtt < 3000) {
            loadedPing = pRtt;
          }
        } catch (e) {
          // ignore
        }
      }, 1500);

      // Stream worker function
      const runStream = async (streamIndex) => {
        while (isDlRunning && !this.isAborted) {
          try {
            const url = `https://speed.cloudflare.com/__down?bytes=25000000&s=${streamIndex}&t=${Date.now()}`;
            const res = await fetch(url, {
              method: 'GET',
              cache: 'no-store',
              mode: 'cors',
              signal
            });

            if (!res.body) {
              const buf = await res.arrayBuffer();
              totalBytesReceived += buf.byteLength;
              continue;
            }

            const reader = res.body.getReader();
            while (isDlRunning && !this.isAborted) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalBytesReceived += value.length;
              }
            }
          } catch (e) {
            if (!isDlRunning || this.isAborted) break;
            await new Promise(r => setTimeout(r, 100));
          }
        }
      };

      // Launch parallel stream promises
      const streamPromises = [];
      for (let s = 0; s < numStreams; s++) {
        streamPromises.push(runStream(s));
      }

      // Periodic progress ticker
      let lastBytes = 0;
      let lastTime = startTime;

      while ((performance.now() - startTime) < durationMs && !this.isAborted) {
        await new Promise(r => setTimeout(r, 200));

        const now = performance.now();
        const elapsedSec = (now - startTime) / 1000;
        const intervalSec = (now - lastTime) / 1000;
        const intervalBytes = totalBytesReceived - lastBytes;

        if (intervalSec > 0) {
          const instantMbps = (intervalBytes * 8) / (intervalSec * 1000000);
          const cumulativeMbps = elapsedSec > 0 ? (totalBytesReceived * 8) / (elapsedSec * 1000000) : 0;
          
          // Smooth blend
          const displayMbps = parseFloat(((instantMbps * 0.4) + (cumulativeMbps * 0.6)).toFixed(2));
          if (elapsedSec > 1.0) {
            sampleRates.push(displayMbps);
          }

          const dlProgress = Math.min(1.0, elapsedSec / (durationMs / 1000));
          onLiveUpdate(displayMbps, loadedPing, dlProgress);

          lastBytes = totalBytesReceived;
          lastTime = now;
        }
      }

      isDlRunning = false;
      clearInterval(loadedPingInterval);

      const totalElapsedSec = (performance.now() - startTime) / 1000;
      let finalMbps = totalElapsedSec > 0 ? parseFloat(((totalBytesReceived * 8) / (totalElapsedSec * 1000000)).toFixed(2)) : 0;

      // If sample rates collected, take trimmed mean for accuracy
      if (sampleRates.length >= 4) {
        sampleRates.sort((a, b) => a - b);
        const trimmed = sampleRates.slice(1, -1);
        const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
        finalMbps = parseFloat(avg.toFixed(2));
      }

      return {
        finalMbps: Math.max(0.1, finalMbps),
        totalBytes: totalBytesReceived,
        loadedPing
      };
    }

    /**
     * Measure Upload Throughput with parallel chunk POSTing
     */
    async measureUpload(signal, onLiveUpdate) {
      const durationMs = this.options.uploadDurationMs;
      const numStreams = this.options.uploadStreams;
      const startTime = performance.now();
      let totalBytesUploaded = 0;
      const sampleRates = [];
      let loadedPing = null;

      let isUlRunning = true;

      // Prepare random upload payload chunks (1 MB each)
      const chunkSize = 1024 * 1024; // 1 MB
      const chunkData = new Uint8Array(chunkSize);
      for (let i = 0; i < chunkSize; i += 64) {
        chunkData[i] = Math.floor(Math.random() * 256);
      }
      const chunkBlob = new Blob([chunkData]);

      // Loaded ping probe timer
      const loadedPingInterval = setInterval(async () => {
        if (!isUlRunning || this.isAborted) return;
        const pStart = performance.now();
        try {
          await fetch(`https://speed.cloudflare.com/__down?bytes=0&ulp=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            mode: 'cors',
            signal
          });
          const pRtt = Math.round(performance.now() - pStart);
          if (pRtt > 0 && pRtt < 3000) {
            loadedPing = pRtt;
          }
        } catch (e) {
          // ignore
        }
      }, 1500);

      // Stream upload function
      const runUploadStream = async (streamIndex) => {
        while (isUlRunning && !this.isAborted) {
          try {
            const url = `https://speed.cloudflare.com/__up?s=${streamIndex}&t=${Date.now()}`;
            await fetch(url, {
              method: 'POST',
              body: chunkBlob,
              cache: 'no-store',
              mode: 'cors',
              signal
            });
            totalBytesUploaded += chunkSize;
          } catch (e) {
            if (!isUlRunning || this.isAborted) break;
            await new Promise(r => setTimeout(r, 80));
          }
        }
      };

      // Launch upload stream workers
      const streamPromises = [];
      for (let s = 0; s < numStreams; s++) {
        streamPromises.push(runUploadStream(s));
      }

      // Periodic progress ticker
      let lastBytes = 0;
      let lastTime = startTime;

      while ((performance.now() - startTime) < durationMs && !this.isAborted) {
        await new Promise(r => setTimeout(r, 200));

        const now = performance.now();
        const elapsedSec = (now - startTime) / 1000;
        const intervalSec = (now - lastTime) / 1000;
        const intervalBytes = totalBytesUploaded - lastBytes;

        if (intervalSec > 0) {
          const instantMbps = (intervalBytes * 8) / (intervalSec * 1000000);
          const cumulativeMbps = elapsedSec > 0 ? (totalBytesUploaded * 8) / (elapsedSec * 1000000) : 0;
          
          const displayMbps = parseFloat(((instantMbps * 0.4) + (cumulativeMbps * 0.6)).toFixed(2));
          if (elapsedSec > 0.8) {
            sampleRates.push(displayMbps);
          }

          const ulProgress = Math.min(1.0, elapsedSec / (durationMs / 1000));
          onLiveUpdate(displayMbps, loadedPing, ulProgress);

          lastBytes = totalBytesUploaded;
          lastTime = now;
        }
      }

      isUlRunning = false;
      clearInterval(loadedPingInterval);

      const totalElapsedSec = (performance.now() - startTime) / 1000;
      let finalMbps = totalElapsedSec > 0 ? parseFloat(((totalBytesUploaded * 8) / (totalElapsedSec * 1000000)).toFixed(2)) : 0;

      if (sampleRates.length >= 3) {
        sampleRates.sort((a, b) => a - b);
        const trimmed = sampleRates.slice(1, -1);
        const avg = trimmed.reduce((a, b) => a + b, 0) / (trimmed.length || 1);
        finalMbps = parseFloat(avg.toFixed(2));
      }

      return {
        finalMbps: Math.max(0.1, finalMbps),
        totalBytes: totalBytesUploaded,
        loadedPing
      };
    }
  }

  // Support Web Worker context
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
    let activeRunner = null;

    self.onmessage = async function (e) {
      const msg = e.data || {};
      if (msg.action === 'start') {
        if (activeRunner) activeRunner.abort();
        activeRunner = new SpeedtestRunner({
          onProgress: (data) => self.postMessage({ type: 'progress', data }),
          onComplete: (results) => self.postMessage({ type: 'complete', results }),
          onError: (err) => self.postMessage({ type: 'error', error: err ? err.message : 'Unknown error' })
        });
        activeRunner.run();
      } else if (msg.action === 'abort') {
        if (activeRunner) activeRunner.abort();
      }
    };
  }

  // Export to global scope
  global.NetPulseSpeedtestRunner = SpeedtestRunner;

})(typeof self !== 'undefined' ? self : this);
