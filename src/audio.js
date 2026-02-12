class AudioEngine {
  constructor() {
    this.ctx = null;
    this.bgm = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    // Initialize Web Audio Context for SFX
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Initialize BGM
    this.bgm = new Audio('/bg.mp3');
    this.bgm.loop = true;
    
    this.isInitialized = true;
  }

  async resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async playSquare(freq, duration, volume = 0.1, type = 'square') {
    if (!this.ctx) return;
    await this.resumeContext();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  async playNoise(duration, volume = 0.05) {
    if (!this.ctx) return;
    await this.resumeContext();

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  playMove() {
    this.playSquare(150, 0.05, 0.05, 'square');
  }

  playRotate() {
    this.playSquare(300, 0.1, 0.05, 'square');
  }

  playLand() {
    this.playSquare(100, 0.2, 0.1, 'square');
  }

  playClear() {
    this.playSquare(400, 0.1, 0.1, 'square');
    setTimeout(() => this.playSquare(600, 0.1, 0.1), 100);
    setTimeout(() => this.playSquare(800, 0.2, 0.1), 200);
  }

  playGameOver() {
    this.playSquare(400, 0.2, 0.1, 'square');
    setTimeout(() => this.playSquare(300, 0.2, 0.1), 200);
    setTimeout(() => this.playSquare(200, 0.4, 0.1), 400);
  }

  async startBGM() {
    if (!this.bgm) return;
    await this.resumeContext();
    this.bgm.currentTime = 0;
    this.bgm.play().catch(e => console.log("BGM play failed:", e));
  }

  pauseBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  resumeBGM() {
    if (this.bgm && this.bgm.paused) {
      this.bgm.play().catch(e => console.log("BGM resume failed:", e));
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }
}

export const audio = new AudioEngine();
