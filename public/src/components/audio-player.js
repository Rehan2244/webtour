import { EventEmitter } from '../utils/event-emitter.js';

export class AudioPlayer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      autoPlay: false,
      showProgress: true,
      showDuration: true,
      showVolumeControl: true,
      showPlaybackSpeed: true,
      playbackSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
      defaultVolume: 0.7,
      theme: 'light',
      ...options
    };
    
    this.element = null;
    this.audio = null;
    this.progressBar = null;
    this.playButton = null;
    this.volumeSlider = null;
    this.speedButton = null;
    this.currentTimeDisplay = null;
    this.durationDisplay = null;
    
    this.isPlaying = false;
    this.currentSpeed = 1;
    this.currentSpeedIndex = this.options.playbackSpeeds.indexOf(1);
  }
  
  mount(container) {
    if (this.element) return;
    
    // Create audio element
    this.audio = document.createElement('audio');
    this.audio.preload = 'metadata';
    this.audio.volume = this.options.defaultVolume;
    
    // Create player container
    this.element = document.createElement('div');
    this.element.className = `guided-tour-audio-player guided-tour-audio-player-${this.options.theme}`;
    
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'guided-tour-audio-controls';
    
    // Play/Pause button
    this.playButton = document.createElement('button');
    this.playButton.className = 'guided-tour-audio-play';
    this.playButton.setAttribute('aria-label', 'Play audio');
    this.playButton.innerHTML = this._getPlayIcon();
    this.playButton.addEventListener('click', () => this.togglePlay());
    controls.appendChild(this.playButton);
    
    // Progress container
    if (this.options.showProgress || this.options.showDuration) {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'guided-tour-audio-progress-container';
      
      // Current time display
      if (this.options.showDuration) {
        this.currentTimeDisplay = document.createElement('span');
        this.currentTimeDisplay.className = 'guided-tour-audio-time';
        this.currentTimeDisplay.textContent = '0:00';
        progressContainer.appendChild(this.currentTimeDisplay);
      }
      
      // Progress bar
      if (this.options.showProgress) {
        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'guided-tour-audio-progress-wrapper';
        
        this.progressBar = document.createElement('input');
        this.progressBar.type = 'range';
        this.progressBar.className = 'guided-tour-audio-progress';
        this.progressBar.min = '0';
        this.progressBar.max = '100';
        this.progressBar.value = '0';
        this.progressBar.setAttribute('aria-label', 'Seek audio');
        
        const progressFill = document.createElement('div');
        progressFill.className = 'guided-tour-audio-progress-fill';
        
        progressWrapper.appendChild(this.progressBar);
        progressWrapper.appendChild(progressFill);
        progressContainer.appendChild(progressWrapper);
        
        // Progress bar events
        this.progressBar.addEventListener('input', (e) => {
          const percent = e.target.value;
          this.seek(percent);
          progressFill.style.width = `${percent}%`;
        });
      }
      
      // Duration display
      if (this.options.showDuration) {
        this.durationDisplay = document.createElement('span');
        this.durationDisplay.className = 'guided-tour-audio-time';
        this.durationDisplay.textContent = '0:00';
        progressContainer.appendChild(this.durationDisplay);
      }
      
      controls.appendChild(progressContainer);
    }
    
    // Volume control
    if (this.options.showVolumeControl) {
      const volumeContainer = document.createElement('div');
      volumeContainer.className = 'guided-tour-audio-volume-container';
      
      const volumeButton = document.createElement('button');
      volumeButton.className = 'guided-tour-audio-volume-button';
      volumeButton.setAttribute('aria-label', 'Toggle mute');
      volumeButton.innerHTML = this._getVolumeIcon();
      volumeButton.addEventListener('click', () => this.toggleMute());
      volumeContainer.appendChild(volumeButton);
      
      this.volumeSlider = document.createElement('input');
      this.volumeSlider.type = 'range';
      this.volumeSlider.className = 'guided-tour-audio-volume';
      this.volumeSlider.min = '0';
      this.volumeSlider.max = '100';
      this.volumeSlider.value = this.options.defaultVolume * 100;
      this.volumeSlider.setAttribute('aria-label', 'Volume control');
      this.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
      volumeContainer.appendChild(this.volumeSlider);
      
      controls.appendChild(volumeContainer);
    }
    
    // Playback speed control
    if (this.options.showPlaybackSpeed) {
      this.speedButton = document.createElement('button');
      this.speedButton.className = 'guided-tour-audio-speed';
      this.speedButton.textContent = '1x';
      this.speedButton.setAttribute('aria-label', 'Change playback speed');
      this.speedButton.addEventListener('click', () => this.cycleSpeed());
      controls.appendChild(this.speedButton);
    }
    
    this.element.appendChild(controls);
    
    // Audio event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.durationDisplay) {
        this.durationDisplay.textContent = this._formatTime(this.audio.duration);
      }
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this._updateProgress();
    });
    
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.playButton.innerHTML = this._getPlayIcon();
      this.emit('ended');
    });
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      this.emit('error', e);
    });
    
    // Append to container
    if (container) {
      container.appendChild(this.element);
    }
  }
  
  setSrc(src) {
    if (!this.audio) return;
    
    this.audio.src = src;
    this.audio.load();
    
    if (this.options.autoPlay) {
      this.play();
    }
  }
  
  play() {
    if (!this.audio || !this.audio.src) return;
    
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.playButton.innerHTML = this._getPauseIcon();
      this.emit('play');
    }).catch(err => {
      console.error('Failed to play audio:', err);
      this.emit('error', err);
    });
  }
  
  pause() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.isPlaying = false;
    this.playButton.innerHTML = this._getPlayIcon();
    this.emit('pause');
  }
  
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  seek(percent) {
    if (!this.audio || !this.audio.duration) return;
    
    const time = (percent / 100) * this.audio.duration;
    this.audio.currentTime = time;
  }
  
  setVolume(volume) {
    if (!this.audio) return;
    
    this.audio.volume = Math.max(0, Math.min(1, volume));
    if (this.volumeSlider) {
      this.volumeSlider.value = volume * 100;
    }
  }
  
  toggleMute() {
    if (!this.audio) return;
    
    this.audio.muted = !this.audio.muted;
    const volumeButton = this.element.querySelector('.guided-tour-audio-volume-button');
    if (volumeButton) {
      volumeButton.innerHTML = this.audio.muted ? this._getMuteIcon() : this._getVolumeIcon();
    }
  }
  
  cycleSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.options.playbackSpeeds.length;
    this.currentSpeed = this.options.playbackSpeeds[this.currentSpeedIndex];
    
    if (this.audio) {
      this.audio.playbackRate = this.currentSpeed;
    }
    
    if (this.speedButton) {
      this.speedButton.textContent = `${this.currentSpeed}x`;
    }
  }
  
  _updateProgress() {
    if (!this.audio || !this.audio.duration) return;
    
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    
    if (this.progressBar) {
      this.progressBar.value = percent;
      const progressFill = this.element.querySelector('.guided-tour-audio-progress-fill');
      if (progressFill) {
        progressFill.style.width = `${percent}%`;
      }
    }
    
    if (this.currentTimeDisplay) {
      this.currentTimeDisplay.textContent = this._formatTime(this.audio.currentTime);
    }
  }
  
  _formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  _getPlayIcon() {
    return `<svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M8 5v14l11-7z"/>
    </svg>`;
  }
  
  _getPauseIcon() {
    return `<svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>`;
  }
  
  _getVolumeIcon() {
    return `<svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    </svg>`;
  }
  
  _getMuteIcon() {
    return `<svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-18-18zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>`;
  }
  
  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    
    this.removeAllListeners();
  }
}