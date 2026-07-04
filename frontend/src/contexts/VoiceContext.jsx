import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';

const VoiceContext = createContext(undefined);

export const VoiceProvider = ({ children }) => {
  const { settings } = useAuth();
  const settingsRef = useRef(settings);
  
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [voiceState, setVoiceState] = useState('ready'); // ready, listening, thinking, completed
  const [transcript, setTranscript] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('Say "Hey Nova" or click the mic');
  const [pendingAction, setPendingAction] = useState(null);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const navigate = useNavigate();

  // Use refs to avoid stale closures in event listeners
  const voiceStateRef = useRef(voiceState);
  const wakeWordListeningRef = useRef(true); // default ON

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const handleVoiceCommandRef = useRef(null);
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        const phrase = settingsRef.current?.voiceWakePhrase || 'Hey Nova';
        if (voiceStateRef.current === 'ready') {
          const msg = phrase.toLowerCase() === 'hey nova'
            ? 'Nova is listening. Say "Hey Nova"'
            : `Nova is listening. Say "${phrase}" or "Hey Nova"`;
          setVoiceMessage(msg);
        } else {
          setVoiceMessage('Listening...');
        }
      };

      rec.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        const lowerText = text.toLowerCase().trim();
        
        console.log(`[SPEECH RECOGNIZED] State: ${voiceStateRef.current}, Text: "${lowerText}"`);

        if (voiceStateRef.current === 'ready') {
          const configWakePhrase = (settingsRef.current?.voiceWakePhrase || 'Hey Nova').toLowerCase();
          // 1. Wake word detection state
          if (
            lowerText.includes(configWakePhrase) ||
            lowerText.includes('nova') || 
            lowerText.includes('hey nova') ||
            lowerText.includes('active nova')
          ) {
            setVoiceState('listening');
            setVoiceMessage('Active: Listening for your command...');
            speak('How can I help you?');
            
            // Wait for Nova to finish speaking the prompt, then start listening for the command
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.warn('Recognition already active');
              }
            }, 1400);
          }
        } else if (voiceStateRef.current === 'listening') {
          // 2. Active command capture state
          setTranscript(text);
          setVoiceState('thinking');
          setVoiceMessage(`Processing: "${text}"`);
          
          setTimeout(() => {
            if (handleVoiceCommandRef.current) {
              handleVoiceCommandRef.current(text);
            }
          }, 1000);
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition event warning:', event.error);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Enable permissions in your browser URL bar.');
          setVoiceMessage('Microphone permission blocked.');
          wakeWordListeningRef.current = false; // Disable to prevent error loop
        } else if (event.error === 'network') {
          toast.error('Network error. Chrome/Edge speech recognition requires an internet connection.');
          setVoiceMessage('Network connection error.');
          wakeWordListeningRef.current = false;
        } else if (event.error === 'no-speech') {
          // Silent reset
          setVoiceState('ready');
          setVoiceMessage('Nova is listening. Say "Hey Nova"');
        } else if (event.error === 'aborted') {
          // Silent reset
          setVoiceState('ready');
        } else {
          setVoiceState('ready');
          setVoiceMessage('Microphone error. Click to retry.');
        }
      };

      rec.onend = () => {
        const isVoiceEnabled = settingsRef.current?.voiceEnabled ?? true;
        // If wake-word listening is enabled and state is ready, restart the background listener automatically
        if (wakeWordListeningRef.current && voiceStateRef.current === 'ready' && isVoiceEnabled) {
          setTimeout(() => {
            try {
              if (recognitionRef.current && voiceStateRef.current === 'ready' && settingsRef.current?.voiceEnabled !== false) {
                recognitionRef.current.start();
              }
            } catch (e) {
              // Already listening
            }
          }, 400); // Small pause to prevent overlapping
        }
      };

      recognitionRef.current = rec;

      // Start background wake word listener on mount
      setTimeout(() => {
        try {
          const isVoiceEnabled = settingsRef.current?.voiceEnabled ?? true;
          if (recognitionRef.current && voiceStateRef.current === 'ready' && isVoiceEnabled) {
            recognitionRef.current.start();
          }
        } catch (e) {}
      }, 1500);

    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

  // Proactively restart or stop background listener whenever voiceState or settings change
  useEffect(() => {
    const isVoiceEnabled = settings?.voiceEnabled ?? true;
    
    if (!isVoiceEnabled) {
      if (voiceState === 'ready' && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setVoiceMessage('Nova is ready. Click the mic to speak.');
      }
      return;
    }

    if (voiceState === 'ready' && recognitionRef.current && wakeWordListeningRef.current) {
      // Small timeout to allow browser speech synthesis to finish before opening microphone
      const timer = setTimeout(() => {
        try {
          if (voiceStateRef.current === 'ready') {
            recognitionRef.current.start();
            const phrase = settings?.voiceWakePhrase || 'Hey Nova';
            const msg = phrase.toLowerCase() === 'hey nova'
              ? 'Nova is listening. Say "Hey Nova"'
              : `Nova is listening. Say "${phrase}" or "Hey Nova"`;
            setVoiceMessage(msg);
          }
        } catch (e) {
          // Already running
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [voiceState, settings]);

  const speak = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop any current speaking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings?.voiceSpeed || 1.0;
    utterance.pitch = settings?.voicePitch || 1.0;
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setVoiceState('listening');
        recognitionRef.current.stop(); // stop background wake word listener
        setTimeout(() => {
          try {
            recognitionRef.current.start(); // start active command capture
          } catch(e) {}
        }, 300);
      } catch (e) {
        console.warn('Recognition toggle error');
      }
    } else {
      toast.error('Voice Recognition is not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceState('ready');
    }
  };

  // Process matching commands
  const handleVoiceCommand = async (command) => {
    const text = command.trim();
    if (!text) return;

    // Check if there is a pending action (e.g. deletion confirmation or edit details)
    if (pendingAction) {
      const lowerText = text.toLowerCase().trim();

      if (pendingAction.type === 'selectTaskToEdit') {
        setVoiceState('thinking');
        setVoiceMessage('Finding task...');
        try {
          const tasksRes = await api.get('/tasks');
          const tasks = tasksRes.data.data;
          const task = tasks.find(t => 
            t.title.toLowerCase().includes(lowerText) || 
            lowerText.includes(t.title.toLowerCase())
          );
          if (task) {
            setPendingAction({ type: 'edit', taskTitle: task.title });
            const resp = 'What would you like to change?';
            speak(resp);
            setVoiceMessage(resp);
            setVoiceState('listening');
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {}
                  }, 400);
                }
              } catch (e) {}
            }, 1200);
          } else {
            const resp = `Could not find task "${text}". Which task would you like to edit?`;
            speak(resp);
            setVoiceMessage(resp);
            setVoiceState('listening');
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {}
                  }, 400);
                }
              } catch (e) {}
            }, 1500);
          }
        } catch (err) {
          console.error(err);
          setPendingAction(null);
          setVoiceState('ready');
        }
        return;
      }

      if (pendingAction.type === 'selectTaskToDelete') {
        setVoiceState('thinking');
        setVoiceMessage('Finding task...');
        try {
          const tasksRes = await api.get('/tasks');
          const tasks = tasksRes.data.data;
          const task = tasks.find(t => 
            t.title.toLowerCase().includes(lowerText) || 
            lowerText.includes(t.title.toLowerCase())
          );
          if (task) {
            setPendingAction({ type: 'delete', taskTitle: task.title });
            const resp = 'Are you sure need to delete?';
            speak(resp);
            setVoiceMessage(resp);
            setVoiceState('listening');
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {}
                  }, 400);
                }
              } catch (e) {}
            }, 1200);
          } else {
            const resp = `Could not find task "${text}". Which task would you like to delete?`;
            speak(resp);
            setVoiceMessage(resp);
            setVoiceState('listening');
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {}
                  }, 400);
                }
              } catch (e) {}
            }, 1500);
          }
        } catch (err) {
          console.error(err);
          setPendingAction(null);
          setVoiceState('ready');
        }
        return;
      }
      
      if (pendingAction.type === 'delete') {
        if (
          lowerText.includes('yes') || 
          lowerText.includes('confirm') || 
          lowerText.includes('sure') || 
          lowerText.includes('ok') || 
          lowerText.includes('do it') ||
          lowerText === 'y'
        ) {
          setVoiceState('thinking');
          setVoiceMessage(`Deleting task...`);
          const loadToast = toast.loading('Deleting task...');
          try {
            const tasksRes = await api.get('/tasks');
            const tasks = tasksRes.data.data;
            const task = tasks.find(t => 
              t.title.toLowerCase().includes(pendingAction.taskTitle.toLowerCase()) || 
              pendingAction.taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            if (task) {
              await api.delete(`/tasks/${task._id}`);
              toast.dismiss(loadToast);
              const msg = `Task "${task.title}" deleted.`;
              speak(msg);
              setVoiceMessage(msg);
              setVoiceState('completed');
              window.dispatchEvent(new CustomEvent('task_created_via_voice'));
              toast.success(msg);
            } else {
              toast.dismiss(loadToast);
              const msg = `Task "${pendingAction.taskTitle}" not found.`;
              speak(msg);
              setVoiceMessage(msg);
              setVoiceState('completed');
            }
          } catch (err) {
            toast.dismiss(loadToast);
            console.error(err);
            speak('Failed to delete task.');
            setVoiceMessage('Error deleting task.');
            setVoiceState('ready');
          }
          setPendingAction(null);
          setTimeout(() => setVoiceState('ready'), 2500);
        } else {
          setPendingAction(null);
          const msg = 'Deletion cancelled.';
          speak(msg);
          setVoiceMessage(msg);
          setVoiceState('completed');
          setTimeout(() => setVoiceState('ready'), 2500);
        }
        return;
      }

      if (pendingAction.type === 'edit') {
        setVoiceState('thinking');
        setVoiceMessage(`Updating task...`);
        const loadToast = toast.loading('Updating task...');
        try {
          const res = await api.post('/voice/process', { 
            transcript: text,
            context: { taskTitle: pendingAction.taskTitle }
          });
          const { action, parameters, response } = res.data;

          if (action === 'updateTask') {
            const tasksRes = await api.get('/tasks');
            const tasks = tasksRes.data.data;
            const task = tasks.find(t => 
              t.title.toLowerCase().includes(parameters.taskTitle.toLowerCase()) || 
              parameters.taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            if (task) {
              const updatedData = { [parameters.field]: parameters.value };
              await api.put(`/tasks/${task._id}`, updatedData);
              toast.dismiss(loadToast);
              speak(response);
              setVoiceMessage(response);
              setVoiceState('completed');
              window.dispatchEvent(new CustomEvent('task_created_via_voice'));
              toast.success(`Task "${task.title}" updated.`);
            } else {
              toast.dismiss(loadToast);
              const msg = `Task "${parameters.taskTitle}" not found.`;
              speak(msg);
              setVoiceMessage(msg);
              setVoiceState('completed');
            }
          } else {
            toast.dismiss(loadToast);
            speak(response);
            setVoiceMessage(response);
            setVoiceState('completed');
          }
        } catch (err) {
          toast.dismiss(loadToast);
          console.error(err);
          speak('Failed to update task.');
          setVoiceMessage('Error updating task.');
          setVoiceState('ready');
        }
        setPendingAction(null);
        setTimeout(() => setVoiceState('ready'), 2500);
        return;
      }
    }

    setVoiceState('thinking');
    setVoiceMessage(`Analyzing: "${text}"`);

    try {
      // Forward text to the backend API to handle NLP intent classification (Gemini or semantic fallback)
      const res = await api.post('/voice/process', { transcript: text });
      const { action, parameters, response } = res.data;

      console.log(`[VOICE AGENT RESPONSE] Action: ${action}, Params:`, parameters);

      if (action === 'askDeleteConfirmation') {
        setVoiceMessage(response);
        speak(response);
        setVoiceState('listening');
        setPendingAction({ type: 'delete', taskTitle: parameters.taskTitle });
        
        // Stop current recognition and start clean follow-up session after brief delay
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }, 400);
            }
          } catch (e) {
            console.warn('Recognition toggle error');
          }
        }, 1200);
        return;
      }

      if (action === 'askEditDetails') {
        setVoiceMessage(response);
        speak(response);
        setVoiceState('listening');
        setPendingAction({ type: 'edit', taskTitle: parameters.taskTitle });
        
        // Stop current recognition and start clean follow-up session after brief delay
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }, 400);
            }
          } catch (e) {
            console.warn('Recognition toggle error');
          }
        }, 1200);
        return;
      }

      if (action === 'askSelectTaskToEdit') {
        setVoiceMessage(response);
        speak(response);
        setVoiceState('listening');
        setPendingAction({ type: 'selectTaskToEdit' });
        
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }, 400);
            }
          } catch (e) {}
        }, 1200);
        return;
      }

      if (action === 'askSelectTaskToDelete') {
        setVoiceMessage(response);
        speak(response);
        setVoiceState('listening');
        setPendingAction({ type: 'selectTaskToDelete' });
        
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }, 400);
            }
          } catch (e) {}
        }, 1200);
        return;
      }

      // Speak back the response
      speak(response);
      setVoiceMessage(response);

      const isQuestion = response.trim().endsWith('?');
      if (isQuestion) {
        setVoiceState('listening');
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }, 400);
            }
          } catch (e) {}
        }, 1200);
      } else {
        setVoiceState('completed');
      }

      // Execute structured layout actions returned by the AI agent
      if (action === 'navigatePage') {
        const page = parameters.page;
        setTimeout(() => {
          if (page === 'dashboard') {
            navigate('/dashboard');
          } else if (page === 'login') {
            navigate('/login');
          } else if (page === 'register') {
            navigate('/register');
          } else {
            navigate(`/dashboard/${page}`);
          }
          setVoiceState('ready');
        }, 1500);
      } else if (action === 'createTask') {
        // Automatically insert task card using API
        await api.post('/tasks', {
          title: parameters.title,
          description: parameters.description || '',
          priority: parameters.priority || 'medium',
          category: parameters.category || 'general'
        });
        
        // Dispatch task list reload event
        window.dispatchEvent(new CustomEvent('task_created_via_voice'));
        
        toast.success(`Task "${parameters.title}" created!`);
        setTimeout(() => {
          setVoiceState('ready');
        }, 1500);
      } else if (action === 'updateTask') {
        try {
          const tasksRes = await api.get('/tasks');
          const tasks = tasksRes.data.data;
          const task = tasks.find(t => 
            t.title.toLowerCase().includes(parameters.taskTitle.toLowerCase()) || 
            parameters.taskTitle.toLowerCase().includes(t.title.toLowerCase())
          );
          if (task) {
            const updatedData = { [parameters.field]: parameters.value };
            await api.put(`/tasks/${task._id}`, updatedData);
            window.dispatchEvent(new CustomEvent('task_created_via_voice'));
            toast.success(`Task "${task.title}" updated.`);
          } else {
            const msg = `Task "${parameters.taskTitle}" not found.`;
            setVoiceMessage(msg);
            speak(msg);
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to update task.');
        }
        setTimeout(() => {
          setVoiceState('ready');
        }, 1500);
      } else if (action === 'deleteTask') {
        try {
          const tasksRes = await api.get('/tasks');
          const tasks = tasksRes.data.data;
          const task = tasks.find(t => 
            t.title.toLowerCase().includes(parameters.taskTitle.toLowerCase()) || 
            parameters.taskTitle.toLowerCase().includes(t.title.toLowerCase())
          );
          if (task) {
            await api.delete(`/tasks/${task._id}`);
            window.dispatchEvent(new CustomEvent('task_created_via_voice'));
            toast.success(`Task "${task.title}" deleted.`);
          } else {
            const msg = `Task "${parameters.taskTitle}" not found.`;
            setVoiceMessage(msg);
            speak(msg);
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete task.');
        }
        setTimeout(() => {
          setVoiceState('ready');
        }, 1500);
      } else if (action === 'loginOAuth') {
        const provider = parameters.provider;
        setTimeout(() => {
          window.dispatchEvent(new Event(`voice_oauth_${provider}`));
          setVoiceState('ready');
        }, 1200);
      } else if (action === 'loginEmail') {
        setTimeout(() => {
          window.dispatchEvent(new Event('voice_login_email'));
          setVoiceState('ready');
        }, 1200);
      } else if (action === 'logout') {
        setTimeout(() => {
          window.dispatchEvent(new Event('auth_session_expired'));
          setVoiceState('ready');
        }, 1500);
      } else if (action === 'openTaskModal') {
        navigate('/dashboard/tasks?create=true');
        setTimeout(() => {
          setVoiceState('ready');
        }, 1000);
      } else {
        // Unmatched conversational message
        const isQuestion = response.trim().endsWith('?');
        if (!isQuestion) {
          setTimeout(() => {
            setVoiceState('ready');
          }, 3000);
        }
      }

    } catch (error) {
      console.error('Voice processing action error:', error);
      speak('Failed to process command.');
      setVoiceMessage('Error processing voice query.');
      setVoiceState('ready');
    }
  };

  useEffect(() => {
    window.__handleVoiceCommandForTesting = handleVoiceCommand;
    return () => {
      delete window.__handleVoiceCommandForTesting;
    };
  }, [handleVoiceCommand]);

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        transcript,
        voiceMessage,
        pendingAction,
        handleVoiceCommand,
        startListening,
        stopListening,
        speak,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
export default VoiceProvider;
