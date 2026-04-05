import { useState, useEffect } from 'react';

const App = () => {
  const [countdown, setCountdown] = useState(30);
  const [started, setStarted] = useState(false);
  const [showDismissButton, setShowDismissButton] = useState(false);

  useEffect(() => {
    window.electronAPI.onStartCountdown((event, data) => {
      setStarted(true);
      setCountdown(data.duration);
      setShowDismissButton(data.showDismissButton);
    });
  }, []);

  useEffect(() => {
    if (!started) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown, started]);

  return (
    <>
      <style>
        {`
          @keyframes gradientAnimation {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 100% 50%;
            }
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #5a6ba0, #6a5488, #8a6b7a, #7a5a68, #4a7a8a, #3a7578, #4a7a68, #3a7060, #5a6ba0, #6a5488)',
        backgroundSize: '400% 400%',
        animation: 'gradientAnimation 30s ease infinite',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        margin: 0
      }}>
      <h1 style={{
        fontSize: '4rem',
        fontWeight: '300',
        marginBottom: '2rem',
        letterSpacing: '2px'
      }}>
        Rest Your Eyes
      </h1>

      <div style={{
        fontSize: '8rem',
        fontWeight: '200',
        marginBottom: '2rem',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {countdown}
      </div>

      {showDismissButton && (
        <button
          onClick={() => window.electronAPI.dismissReminder()}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '400'
          }}
        >
          Dismiss
        </button>
      )}
    </div>
    </>
  );
};

export default App;
