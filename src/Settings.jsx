import { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    reminderInterval: 30,
    breakDuration: 30,
    isPaused: false,
    ignoreWhenScreenRecording: true,
    showDismissButton: false,
    workingHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00'
    }
  });

  const [error, setError] = useState('');

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      await window.electronAPI.saveSettings(newSettings);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    const newSettings = { ...settings, reminderInterval: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value);
    const newSettings = { ...settings, breakDuration: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleIgnoreWhenScreenRecordingChange = (e) => {
    const newSettings = { ...settings, ignoreWhenScreenRecording: e.target.checked };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleShowDismissButtonChange = (e) => {
    const newSettings = { ...settings, showDismissButton: e.target.checked };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleWorkingHoursEnabledChange = (e) => {
    const newSettings = {
      ...settings,
      workingHours: { ...settings.workingHours, enabled: e.target.checked }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleStartTimeChange = (e) => {
    const newSettings = {
      ...settings,
      workingHours: { ...settings.workingHours, startTime: e.target.value }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleEndTimeChange = (e) => {
    const newSettings = {
      ...settings,
      workingHours: { ...settings.workingHours, endTime: e.target.value }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '460px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '30px', fontWeight: '500' }}>
        Rye Settings
      </h1>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Reminder Interval (minutes)
        </label>
        <select
          value={settings.reminderInterval}
          onChange={handleIntervalChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxSizing: 'border-box'
          }}
        >
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">60 minutes</option>
        </select>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Reminders at even clock intervals
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Break Duration (seconds)
        </label>
        <input
          type="number"
          min="10"
          max="300"
          step="10"
          value={settings.breakDuration}
          onChange={handleDurationChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          How long each break lasts (10-300 seconds)
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.ignoreWhenScreenRecording}
            onChange={handleIgnoreWhenScreenRecordingChange}
            style={{ marginRight: '8px', cursor: 'pointer' }}
          />
          Ignore when screen recording
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
          Don't show reminders during screen recording or sharing
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.showDismissButton}
            onChange={handleShowDismissButtonChange}
            style={{ marginRight: '8px', cursor: 'pointer' }}
          />
          Show dismiss button
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
          Display a button to manually close reminders
        </div>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          fontWeight: '500',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.workingHours.enabled}
            onChange={handleWorkingHoursEnabledChange}
            style={{ marginRight: '8px', cursor: 'pointer' }}
          />
          Enable Working Hours
        </label>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: settings.workingHours.enabled ? '#000' : '#999'
          }}>
            Start Time
          </label>
          <input
            type="time"
            value={settings.workingHours.startTime}
            onChange={handleStartTimeChange}
            disabled={!settings.workingHours.enabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box',
              backgroundColor: settings.workingHours.enabled ? 'white' : '#f5f5f5',
              cursor: settings.workingHours.enabled ? 'text' : 'not-allowed'
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: settings.workingHours.enabled ? '#000' : '#999'
          }}>
            End Time
          </label>
          <input
            type="time"
            value={settings.workingHours.endTime}
            onChange={handleEndTimeChange}
            disabled={!settings.workingHours.enabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box',
              backgroundColor: settings.workingHours.enabled ? 'white' : '#f5f5f5',
              cursor: settings.workingHours.enabled ? 'text' : 'not-allowed'
            }}
          />
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Reminders only during these hours (same-day only)
        </div>
      </div>
    </div>
  );
};

export default Settings;
