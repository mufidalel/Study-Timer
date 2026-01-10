// ==================== STATE ====================
const state = {
  studyHours: 0,
  studyMinutes: 25,
  studySeconds: 0,
  breakMinutes: 5,
  breakSeconds: 0,
  totalCycles: 4,
  isInfinite: false,
  
  remainingSeconds: 0,
  sessionState: 'idle', // idle, running, paused, complete
  sessionMode: 'study', // study, break
  currentCycle: 1,
  
  isFocusMode: false,
  particleType: Math.random() > 0.5 ? 'rain' : 'snow',
  
  // Stats
  plannedStudyTime: 0,
  actualStudyTime: 0,
  totalBreakTime: 0,
  completedCycles: 0,
  
  intervalId: null
};

// ==================== DOM ELEMENTS ====================
const $ = (id) => document.getElementById(id);

const elements = {
  app: $('app'),
  header: $('header'),
  modeIndicator: $('mode-indicator'),
  modeBadge: document.querySelector('.mode-badge'),
  modeIcon: document.querySelector('.mode-icon'),
  modeText: document.querySelector('.mode-text'),
  currentCycle: $('current-cycle'),
  totalCyclesDisplay: $('total-cycles-display'),
  timerDisplay: $('timer-display'),
  hours: $('hours'),
  minutes: $('minutes'),
  seconds: $('seconds'),
  startBtn: $('start-btn'),
  pauseBtn: $('pause-btn'),
  resetBtn: $('reset-btn'),
  focusBtn: $('focus-btn'),
  configPanel: $('config-panel'),
  studyHoursInput: $('study-hours'),
  studyMinutesInput: $('study-minutes'),
  studySecondsInput: $('study-seconds'),
  breakMinutesInput: $('break-minutes'),
  breakSecondsInput: $('break-seconds'),
  cyclesInput: $('cycles'),
  infiniteBtn: $('infinite-btn'),
  focusHint: $('focus-hint'),
  summaryPanel: $('summary-panel'),
  scoreValue: $('score-value'),
  scoreLabel: $('score-label'),
  statPlanned: $('stat-planned'),
  statStudied: $('stat-studied'),
  statBreak: $('stat-break'),
  statCycles: $('stat-cycles'),
  newSessionBtn: $('new-session-btn'),
  particleContainer: $('particle-container')
};

// ==================== UTILITY FUNCTIONS ====================
function formatNumber(num) {
  return num.toString().padStart(2, '0');
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getStudyDuration() {
  return state.studyHours * 3600 + state.studyMinutes * 60 + state.studySeconds;
}

function getBreakDuration() {
  return state.breakMinutes * 60 + state.breakSeconds;
}

// ==================== BELL SOUND ====================
function playBellSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const playTone = (freq, gain, duration) => {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    osc.type = 'sine';
    gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
  };
  
  playTone(830, 0.5, 1.5);
  playTone(1660, 0.25, 1);
  playTone(2490, 0.1, 0.5);
}

// ==================== PARTICLES ====================
function createParticles() {
  const container = elements.particleContainer;
  container.innerHTML = '';
  
  const count = state.particleType === 'rain' ? 80 : 50;
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = state.particleType === 'rain' ? 'rain-drop' : 'snow-flake';
    
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = state.particleType === 'rain' 
      ? 0.5 + Math.random() * 0.5 
      : 8 + Math.random() * 8;
    const opacity = 0.3 + Math.random() * 0.5;
    
    particle.style.left = `${left}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.opacity = opacity;
    
    if (state.particleType === 'rain') {
      particle.style.height = `${15 + Math.random() * 25}px`;
    } else {
      const size = 2 + Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
    }
    
    container.appendChild(particle);
  }
}

// ==================== UI UPDATES ====================
function updateTimerDisplay() {
  if (state.sessionState === 'idle') {
    elements.hours.textContent = formatNumber(state.studyHours);
    elements.minutes.textContent = formatNumber(state.studyMinutes);
    elements.seconds.textContent = formatNumber(state.studySeconds);
  } else {
    const h = Math.floor(state.remainingSeconds / 3600);
    const m = Math.floor((state.remainingSeconds % 3600) / 60);
    const s = state.remainingSeconds % 60;
    elements.hours.textContent = formatNumber(h);
    elements.minutes.textContent = formatNumber(m);
    elements.seconds.textContent = formatNumber(s);
  }
  
  // Update mode styling
  if (state.sessionMode === 'break') {
    elements.timerDisplay.classList.add('break-mode');
    document.body.classList.add('break-mode');
  } else {
    elements.timerDisplay.classList.remove('break-mode');
    document.body.classList.remove('break-mode');
  }
}

function updateModeIndicator() {
  if (state.sessionState === 'idle') {
    elements.modeIndicator.classList.add('hidden');
    return;
  }
  
  elements.modeIndicator.classList.remove('hidden');
  elements.currentCycle.textContent = state.currentCycle;
  elements.totalCyclesDisplay.textContent = state.isInfinite ? '∞' : state.totalCycles;
  
  if (state.sessionMode === 'break') {
    elements.modeBadge.className = 'mode-badge break-mode-badge';
    elements.modeIcon.textContent = '☕';
    elements.modeText.textContent = 'Break Time';
  } else {
    elements.modeBadge.className = 'mode-badge study-mode';
    elements.modeIcon.textContent = '📖';
    elements.modeText.textContent = 'Study Mode';
  }
}

function updateButtons() {
  if (state.sessionState === 'running') {
    elements.startBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
  } else {
    elements.startBtn.classList.remove('hidden');
    elements.pauseBtn.classList.add('hidden');
  }
  
  elements.startBtn.disabled = getStudyDuration() === 0;
}

function updateConfigInputs() {
  const disabled = state.sessionState !== 'idle';
  const inputs = elements.configPanel.querySelectorAll('input');
  inputs.forEach(input => input.disabled = disabled);
  elements.infiniteBtn.disabled = disabled;
}

function toggleFocusMode() {
  state.isFocusMode = !state.isFocusMode;
  
  if (state.isFocusMode) {
    elements.app.classList.add('focus-mode');
    elements.focusBtn.innerHTML = '<span>⛶</span> Exit';
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    elements.app.classList.remove('focus-mode');
    elements.focusBtn.innerHTML = '<span>⛶</span> Focus';
    document.exitFullscreen?.().catch(() => {});
  }
}

function showSummary() {
  const score = calculateScore();
  
  elements.scoreValue.textContent = score;
  elements.scoreLabel.textContent = getScoreLabel(score);
  elements.statPlanned.textContent = formatTime(state.plannedStudyTime);
  elements.statStudied.textContent = formatTime(state.actualStudyTime);
  elements.statBreak.textContent = formatTime(state.totalBreakTime);
  elements.statCycles.textContent = `${state.completedCycles} / ${state.isInfinite ? state.completedCycles : state.totalCycles}`;
  
  elements.app.classList.add('hidden');
  elements.summaryPanel.classList.remove('hidden');
}

function hideSummary() {
  elements.summaryPanel.classList.add('hidden');
  elements.app.classList.remove('hidden');
}

function calculateScore() {
  if (state.plannedStudyTime === 0) return 0;
  
  const completionRatio = state.actualStudyTime / state.plannedStudyTime;
  const baseScore = Math.min(completionRatio, 1) * 60;
  const cycleBonus = (state.completedCycles / Math.max(state.totalCycles, 1)) * 25;
  const breakRatio = state.totalBreakTime / Math.max(state.actualStudyTime, 1);
  const breakPenalty = breakRatio > 0.3 ? (breakRatio - 0.3) * 20 : 0;
  const overachievementBonus = completionRatio > 1 ? Math.min((completionRatio - 1) * 10, 15) : 0;
  
  return Math.round(Math.min(Math.max(baseScore + cycleBonus - breakPenalty + overachievementBonus, 0), 100));
}

function getScoreLabel(score) {
  if (score >= 90) return 'Outstanding!';
  if (score >= 75) return 'Excellent!';
  if (score >= 60) return 'Great work!';
  if (score >= 40) return 'Good effort!';
  return 'Keep going!';
}

// ==================== TIMER LOGIC ====================
function startTimer() {
  if (getStudyDuration() === 0) return;
  
  if (state.sessionState === 'idle') {
    state.plannedStudyTime = getStudyDuration() * (state.isInfinite ? 1 : state.totalCycles);
    state.actualStudyTime = 0;
    state.totalBreakTime = 0;
    state.completedCycles = 0;
    state.currentCycle = 1;
    state.sessionMode = 'study';
    state.remainingSeconds = getStudyDuration();
  }
  
  state.sessionState = 'running';
  
  state.intervalId = setInterval(() => {
    if (state.remainingSeconds <= 1) {
      playBellSound();
      
      if (state.sessionMode === 'study') {
        state.actualStudyTime += getStudyDuration();
        
        if (!state.isInfinite && state.currentCycle >= state.totalCycles) {
          state.completedCycles = state.currentCycle;
          state.sessionState = 'complete';
          clearInterval(state.intervalId);
          showSummary();
          return;
        }
        
        state.sessionMode = 'break';
        state.remainingSeconds = getBreakDuration();
      } else {
        state.totalBreakTime += getBreakDuration();
        state.completedCycles = state.currentCycle;
        state.currentCycle++;
        state.sessionMode = 'study';
        state.remainingSeconds = getStudyDuration();
      }
    } else {
      if (state.sessionMode === 'study') {
        state.actualStudyTime++;
      } else {
        state.totalBreakTime++;
      }
      state.remainingSeconds--;
    }
    
    updateTimerDisplay();
    updateModeIndicator();
  }, 1000);
  
  updateButtons();
  updateConfigInputs();
  updateModeIndicator();
}

function pauseTimer() {
  state.sessionState = 'paused';
  clearInterval(state.intervalId);
  updateButtons();
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.sessionState = 'idle';
  state.sessionMode = 'study';
  state.remainingSeconds = 0;
  state.currentCycle = 1;
  state.actualStudyTime = 0;
  state.totalBreakTime = 0;
  state.completedCycles = 0;
  
  updateTimerDisplay();
  updateButtons();
  updateConfigInputs();
  updateModeIndicator();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Buttons
  elements.startBtn.addEventListener('click', startTimer);
  elements.pauseBtn.addEventListener('click', pauseTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.focusBtn.addEventListener('click', toggleFocusMode);
  elements.newSessionBtn.addEventListener('click', () => {
    hideSummary();
    resetTimer();
  });
  
  elements.infiniteBtn.addEventListener('click', () => {
    state.isInfinite = !state.isInfinite;
    elements.infiniteBtn.classList.toggle('active', state.isInfinite);
    elements.cyclesInput.disabled = state.isInfinite;
  });
  
  // Input handlers
  const createInputHandler = (key, max) => (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let num = parseInt(value) || 0;
    if (num < 0) num = 0;
    if (max && num > max) num = max;
    state[key] = num;
    e.target.value = num;
    updateTimerDisplay();
  };
  
  elements.studyHoursInput.addEventListener('input', createInputHandler('studyHours', 23));
  elements.studyMinutesInput.addEventListener('input', createInputHandler('studyMinutes', 59));
  elements.studySecondsInput.addEventListener('input', createInputHandler('studySeconds', 59));
  elements.breakMinutesInput.addEventListener('input', createInputHandler('breakMinutes', 59));
  elements.breakSecondsInput.addEventListener('input', createInputHandler('breakSeconds', 59));
  elements.cyclesInput.addEventListener('input', createInputHandler('totalCycles', 99));
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFocusMode();
    }
    if (e.key === 'Escape' && state.isFocusMode) {
      toggleFocusMode();
    }
  });
  
  // Fullscreen change
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && state.isFocusMode) {
      state.isFocusMode = false;
      elements.app.classList.remove('focus-mode');
      elements.focusBtn.innerHTML = '<span>⛶</span> Focus';
    }
  });
}

// ==================== INIT ====================
function init() {
  createParticles();
  setupEventListeners();
  updateTimerDisplay();
  updateButtons();
}

document.addEventListener('DOMContentLoaded', init);
