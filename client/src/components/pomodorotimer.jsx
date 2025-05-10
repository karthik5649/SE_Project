import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, ProgressBar, Form, Alert } from 'react-bootstrap';
import { FaPlay, FaPause, FaRedo, FaCoffee, FaBrain } from 'react-icons/fa';

export default function PomodoroTimer() {
  // Timer states
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');

  // Timer settings
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  // Audio notification
  const audioRef = useRef(null);

  // Set timer based on mode
  useEffect(() => {
    let time;
    switch(timerMode) {
      case 'pomodoro':
        time = pomodoroTime * 60;
        break;
      case 'shortBreak':
        time = shortBreakTime * 60;
        break;
      case 'longBreak':
        time = longBreakTime * 60;
        break;
      default:
        time = pomodoroTime * 60;
    }
    setSecondsLeft(time);
    setIsRunning(false);

    // Update page title
    document.title = `${formatTime(time)} - ${timerMode === 'pomodoro' ? 'Focus Time' : 'Break Time'}`;
  }, [timerMode, pomodoroTime, shortBreakTime, longBreakTime]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Update page title with current time
    document.title = `${formatTime(secondsLeft)} - ${timerMode === 'pomodoro' ? 'Focus Time' : 'Break Time'}`;

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  // Handle timer completion
  const handleTimerComplete = () => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        // Create a fallback beep function using the Web Audio API
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (fallbackError) {
          console.error("Fallback audio also failed:", fallbackError);
        }
      });
    }

    if (timerMode === 'pomodoro') {
      // Increment completed pomodoros
      const newCompletedCount = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedCount);

      // Show alert
      setAlertVariant('success');
      setAlertMessage('Great job! You completed a focus session. Take a break!');
      setShowAlert(true);

      // After 4 pomodoros, take a long break
      if (newCompletedCount % 4 === 0) {
        setTimerMode('longBreak');
      } else {
        setTimerMode('shortBreak');
      }
    } else {
      // Break is over, back to pomodoro
      setTimerMode('pomodoro');
      setAlertVariant('info');
      setAlertMessage('Break time is over. Ready to focus again?');
      setShowAlert(true);
    }

    // Auto-hide alert after 5 seconds
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Format time as MM:SS
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalTime;
    switch(timerMode) {
      case 'pomodoro':
        totalTime = pomodoroTime * 60;
        break;
      case 'shortBreak':
        totalTime = shortBreakTime * 60;
        break;
      case 'longBreak':
        totalTime = longBreakTime * 60;
        break;
      default:
        totalTime = pomodoroTime * 60;
    }

    return ((totalTime - secondsLeft) / totalTime) * 100;
  };

  // Button handlers
  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);

    // Reset based on current mode
    switch(timerMode) {
      case 'pomodoro':
        setSecondsLeft(pomodoroTime * 60);
        break;
      case 'shortBreak':
        setSecondsLeft(shortBreakTime * 60);
        break;
      case 'longBreak':
        setSecondsLeft(longBreakTime * 60);
        break;
      default:
        setSecondsLeft(pomodoroTime * 60);
    }
  };

  // Save settings
  const saveSettings = () => {
    setShowSettings(false);

    // Reset timer with new settings
    switch(timerMode) {
      case 'pomodoro':
        setSecondsLeft(pomodoroTime * 60);
        break;
      case 'shortBreak':
        setSecondsLeft(shortBreakTime * 60);
        break;
      case 'longBreak':
        setSecondsLeft(longBreakTime * 60);
        break;
      default:
        setSecondsLeft(pomodoroTime * 60);
    }

    setAlertVariant('success');
    setAlertMessage('Settings saved successfully!');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <Container className="py-5">
      {/* Audio element for notification */}
      <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" onError={(e) => {
        console.log("Audio failed to load, using browser beep as fallback");
        // Create a fallback beep function using the Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      }} />

      {/* Alert for notifications */}
      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="text-center"
        >
          {alertMessage}
        </Alert>
      )}

      <Row className="justify-content-center mb-4">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center">
              <h2>Pomodoro Timer</h2>
              <div className="d-flex justify-content-center mt-2">
                <Button
                  variant={timerMode === 'pomodoro' ? 'light' : 'outline-light'}
                  className="mx-1"
                  onClick={() => setTimerMode('pomodoro')}
                >
                  <FaBrain className="me-1" /> Focus
                </Button>
                <Button
                  variant={timerMode === 'shortBreak' ? 'light' : 'outline-light'}
                  className="mx-1"
                  onClick={() => setTimerMode('shortBreak')}
                >
                  <FaCoffee className="me-1" /> Short Break
                </Button>
                <Button
                  variant={timerMode === 'longBreak' ? 'light' : 'outline-light'}
                  className="mx-1"
                  onClick={() => setTimerMode('longBreak')}
                >
                  <FaCoffee className="me-1" /> Long Break
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="text-center">
              <h1 className="display-1 mb-4">{formatTime(secondsLeft)}</h1>

              <ProgressBar
                now={calculateProgress()}
                variant={timerMode === 'pomodoro' ? 'primary' : 'success'}
                className="mb-4"
                style={{ height: '10px' }}
              />

              <div className="d-flex justify-content-center mb-4">
                <Button
                  variant={isRunning ? 'warning' : 'success'}
                  size="lg"
                  className="mx-2"
                  onClick={handleStartPause}
                >
                  {isRunning ? <><FaPause /> Pause</> : <><FaPlay /> Start</>}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="mx-2"
                  onClick={handleReset}
                >
                  <FaRedo /> Reset
                </Button>
              </div>

              <div className="text-center mb-3">
                <p className="mb-0">Completed Pomodoros: <span className="badge bg-primary">{completedPomodoros}</span></p>
                <p className="text-muted mt-2">
                  {timerMode === 'pomodoro'
                    ? 'Focus on your task until the timer ends'
                    : 'Take a break and relax your mind'}
                </p>
              </div>

              <Button
                variant="link"
                onClick={() => setShowSettings(!showSettings)}
                className="text-decoration-none"
              >
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </Button>

              {showSettings && (
                <Card className="mt-3">
                  <Card.Body>
                    <h5>Timer Settings</h5>
                    <Form>
                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={6}>Focus Time (minutes):</Form.Label>
                        <Col sm={6}>
                          <Form.Control
                            type="number"
                            min="1"
                            max="60"
                            value={pomodoroTime}
                            onChange={(e) => setPomodoroTime(parseInt(e.target.value) || 25)}
                          />
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={6}>Short Break (minutes):</Form.Label>
                        <Col sm={6}>
                          <Form.Control
                            type="number"
                            min="1"
                            max="30"
                            value={shortBreakTime}
                            onChange={(e) => setShortBreakTime(parseInt(e.target.value) || 5)}
                          />
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={6}>Long Break (minutes):</Form.Label>
                        <Col sm={6}>
                          <Form.Control
                            type="number"
                            min="1"
                            max="60"
                            value={longBreakTime}
                            onChange={(e) => setLongBreakTime(parseInt(e.target.value) || 15)}
                          />
                        </Col>
                      </Form.Group>

                      <Button variant="primary" onClick={saveSettings}>
                        Save Settings
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
            <Card.Footer className="text-muted text-center">
              <p className="mb-0">The Pomodoro Technique helps you stay focused and productive</p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
