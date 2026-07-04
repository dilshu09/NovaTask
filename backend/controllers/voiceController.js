import mongoose from 'mongoose';
import { ErrorResponse } from '../middleware/errorMiddleware.js';

/**
 * Local Semantic Parser Fallback (when Gemini API Key is missing or offline)
 */
const localIntentParser = (text, context) => {
  const query = text.toLowerCase().trim();

  // Helper to parse dates
  const parseDateText = (dateText) => {
    const dQuery = dateText.toLowerCase().trim();
    const now = new Date();
    if (dQuery.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString();
    }
    if (dQuery.includes('today')) {
      return now.toISOString();
    }
    if (dQuery.includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      return nextWeek.toISOString();
    }
    if (dQuery.includes('next monday')) {
      const resultDate = new Date();
      resultDate.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      return resultDate.toISOString();
    }
    if (dQuery.includes('next friday')) {
      const resultDate = new Date();
      resultDate.setDate(now.getDate() + ((5 + 7 - now.getDay()) % 7 || 7));
      return resultDate.toISOString();
    }
    // Clean text and try standard JS parsing
    const cleaned = dateText.replace(/(change due date to|set date to|change date to|due date|date|on|at)/gi, '').trim();
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow.toISOString();
  };

  // 1. Navigation Commands
  if (query.includes('open dashboard') || query.includes('go to dashboard')) {
    return {
      action: 'navigatePage',
      parameters: { page: 'dashboard' },
      response: 'Confirming. Navigating to dashboard.'
    };
  }
  if (query.includes('open tasks') || query.includes('go to tasks') || query.includes('show tasks') || query.includes('go to my task') || query.includes('go to my tasks') || query.includes('my task') || query.includes('my tasks')) {
    return {
      action: 'navigatePage',
      parameters: { page: 'tasks' },
      response: 'Confirming. Opening your task manager.'
    };
  }
  if (
    query.includes('settings') || 
    query.includes('setting') || 
    query.includes('go to settings') || 
    query.includes('open settings') || 
    query.includes('navigate to settings') || 
    query.includes('navigate to setting')
  ) {
    return {
      action: 'navigatePage',
      parameters: { page: 'settings' },
      response: 'Confirming. Opening settings.'
    };
  }
  if (query.includes('open profile') || query.includes('go to profile')) {
    return {
      action: 'navigatePage',
      parameters: { page: 'profile' },
      response: 'Confirming. Opening profile.'
    };
  }
  if (query.includes('create account') || query.includes('sign up') || query.includes('go to register')) {
    return {
      action: 'navigatePage',
      parameters: { page: 'register' },
      response: 'Confirming. Redirecting to registration.'
    };
  }
  if (query.includes('go to login') || query.includes('open login') || (query.includes('sign in') && !query.includes('workspace') && !query.includes('google') && !query.includes('facebook') && !query.includes('apple'))) {
    return {
      action: 'navigatePage',
      parameters: { page: 'login' },
      response: 'Confirming. Redirecting to sign in.'
    };
  }

  // 2. OAuth Commands
  if (query.includes('login with google') || query.includes('continue with google') || query.includes('sign in with google')) {
    return {
      action: 'loginOAuth',
      parameters: { provider: 'google' },
      response: 'Confirming. Logging in with Google.'
    };
  }
  if (query.includes('login with apple') || query.includes('continue with apple') || query.includes('sign in with apple')) {
    return {
      action: 'loginOAuth',
      parameters: { provider: 'apple' },
      response: 'Confirming. Logging in with Apple.'
    };
  }
  if (query.includes('login with facebook') || query.includes('continue with facebook') || query.includes('sign in with facebook')) {
    return {
      action: 'loginOAuth',
      parameters: { provider: 'facebook' },
      response: 'Confirming. Logging in with Facebook.'
    };
  }

  if (query.includes('login with email') || query.includes('continue with email') || query.includes('sign in with email') || query.includes('login email')) {
    return {
      action: 'loginEmail',
      parameters: {},
      response: 'Confirming. Opening email sign in.'
    };
  }

  // 3. Mark as Done Command (High Priority, specific status update)
  if (query.includes('mark') && (query.includes('as done') || query.includes('completed') || query.includes('complete'))) {
    const titlePart = text.replace(/(mark task|mark|as done|completed|complete)/gi, '').trim();
    if (titlePart || (context && context.taskTitle)) {
      return {
        action: 'updateTask',
        parameters: {
          taskTitle: titlePart || context.taskTitle,
          field: 'status',
          value: 'done'
        },
        response: 'Confirming. Status updated to done.'
      };
    }
  }

  // 4. Deletion Commands (always require confirmation)
  if (query.includes('delete task') || query.includes('remove task') || query.startsWith('delete') || query.startsWith('remove')) {
    const titlePart = text.replace(/(delete task|remove task|delete|remove)/gi, '').trim();
    if (titlePart) {
      return {
        action: 'askDeleteConfirmation',
        parameters: { taskTitle: titlePart },
        response: 'Are you sure need to delete?'
      };
    } else {
      return {
        action: 'askSelectTaskToDelete',
        parameters: {},
        response: 'Which task would you like to delete?'
      };
    }
  }

  // 5. Date/Time updates (special confirmation message)
  if ((query.includes('change due date') || query.includes('change date') || query.includes('set date') || query.includes('change time') || query.includes('set time')) && query.includes(' to ')) {
    const toIndex = query.indexOf(' to ');
    if (context && context.taskTitle) {
      const datePart = text.substring(toIndex + 4).trim();
      const parsed = parseDateText(datePart);
      return {
        action: 'updateTask',
        parameters: {
          taskTitle: context.taskTitle,
          field: 'dueDate',
          value: parsed
        },
        response: 'Confirming. Changing due date.'
      };
    } else {
      const ofIndex = query.indexOf(' of ');
      if (ofIndex !== -1 && ofIndex < toIndex) {
        const titlePart = text.substring(ofIndex + 4, toIndex).trim();
        const datePart = text.substring(toIndex + 4).trim();
        const parsed = parseDateText(datePart);
        return {
          action: 'updateTask',
          parameters: {
            taskTitle: titlePart,
            field: 'dueDate',
            value: parsed
          },
          response: 'Confirming. Changing due date.'
        };
      }
    }
  }

  // 6. Other Contextual Field Updates (Title, Description, Priority, Category)
  if (context && context.taskTitle) {
    if (query.includes('change title') && query.includes(' to ')) {
      const val = text.substring(query.indexOf(' to ') + 4).trim();
      return {
        action: 'updateTask',
        parameters: { taskTitle: context.taskTitle, field: 'title', value: val },
        response: `Confirming. Title updated to ${val}.`
      };
    }
    if (query.includes('change description') && query.includes(' to ')) {
      const val = text.substring(query.indexOf(' to ') + 4).trim();
      return {
        action: 'updateTask',
        parameters: { taskTitle: context.taskTitle, field: 'description', value: val },
        response: `Confirming. Description updated to ${val}.`
      };
    }
    if (query.includes('change priority') && query.includes(' to ')) {
      const val = text.substring(query.indexOf(' to ') + 4).trim().toLowerCase();
      const valid = ['low', 'medium', 'high'].includes(val) ? val : 'medium';
      return {
        action: 'updateTask',
        parameters: { taskTitle: context.taskTitle, field: 'priority', value: valid },
        response: `Confirming. Priority updated to ${valid}.`
      };
    }
    if (query.includes('change category') && query.includes(' to ')) {
      const val = text.substring(query.indexOf(' to ') + 4).trim().toLowerCase();
      return {
        action: 'updateTask',
        parameters: { taskTitle: context.taskTitle, field: 'category', value: val },
        response: `Confirming. Category updated to ${val}.`
      };
    }
  }

  // 7. General Edit Task / Update Task activation
  if (query.startsWith('edit') || query.startsWith('update') || query.includes('edit task') || query.includes('update task')) {
    let titlePart = text.replace(/(edit task|update task|edit|update)/gi, '').trim();
    titlePart = titlePart.replace(/^(task)\s+/i, '').trim();
    if (titlePart) {
      return {
        action: 'askEditDetails',
        parameters: { taskTitle: titlePart },
        response: 'What would you like to change?'
      };
    } else {
      return {
        action: 'askSelectTaskToEdit',
        parameters: {},
        response: 'Which task would you like to edit?'
      };
    }
  }

  // 8. Task Creation Commands
  if (query.includes('create task') || query.includes('add a new task') || query.includes('add task') || query.includes('new task') || query.includes('open task modal') || query.includes('open task popup')) {
    // Check if we just want to open the empty modal dialog
    if (query === 'open task modal' || query === 'open task popup' || query === 'open new task dialog') {
      return {
        action: 'openTaskModal',
        parameters: {},
        response: 'Confirming. Opening new task dialog.'
      };
    }

    // Otherwise, parse title and project name parameters
    let title = 'New Voice Task';
    let description = '';
    
    const projectIndex = query.indexOf('project name');
    const projectIndexShort = query.indexOf('project');
    const splitIndex = projectIndex !== -1 ? projectIndex : (projectIndexShort !== -1 ? projectIndexShort : -1);

    if (splitIndex !== -1) {
      const titlePart = text.substring(0, splitIndex).replace(/(create task|add a new task called|add a new task call|add a new task|add task|new task)/gi, '').trim();
      title = titlePart.replace(/(and|called|call)$/i, '').trim();
      
      const descPartIndex = splitIndex + (projectIndex !== -1 ? 12 : 7);
      description = text.substring(descPartIndex).trim();
    } else {
      title = text.replace(/(create task|add a new task called|add a new task call|add a new task|add task|new task)/gi, '').trim();
    }

    return {
      action: 'createTask',
      parameters: {
        title: title || 'New Voice Task',
        description: description || '',
        priority: query.includes('high') ? 'high' : query.includes('low') ? 'low' : 'medium',
        category: query.includes('design') ? 'design' : query.includes('backend') ? 'backend' : query.includes('development') ? 'development' : 'general'
      },
      response: `Confirming. Creating task: "${title || 'New Voice Task'}"${description ? ` under project "${description}"` : ''}.`
    };
  }

  // 9. Logout Commands
  if (query.includes('logout') || query.includes('log out')) {
    return {
      action: 'logout',
      parameters: {},
      response: 'Confirming. Logging out of your workspace.'
    };
  }

  // 10. Default Fallback
  return {
    action: 'none',
    parameters: {},
    response: "I recognized your transcript, but that command doesn't map to a workspace tool. Try saying 'Open Tasks' or 'Create Task [Title]'."
  };
};

// @desc    Process Voice Command using Gemini API Function Calling (with local parser fallback)
// @route   POST /api/voice/process
// @access  Private (or Public for auth page redirect commands)
export const processVoiceCommand = async (req, res, next) => {
  try {
    const { transcript, context } = req.body;
    if (!transcript) {
      return next(new ErrorResponse('Voice transcript is required', 400));
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // If API Key is missing, fall back to local intent parser immediately
    if (!geminiApiKey) {
      console.log('[VOICE PROCESSED] No Gemini API key found. Using local semantic parser.');
      const localResult = localIntentParser(transcript, context);
      return res.status(200).json(localResult);
    }

    // Call Gemini API generateContent with Function Calling
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      
      const systemInstructionText = `You are Nova, a helpful AI productivity assistant for NovaTask Workspace. Call appropriate tools to navigate pages, create tasks, update tasks, request deletion confirmation, ask what changes to make, log in or log out based on the user request. Keep conversational responses short and helpful. ${context && context.taskTitle ? `The user is currently editing or referencing a task with the title "${context.taskTitle}". If they ask to make changes (like change due date, title, description, priority, category, status), use "${context.taskTitle}" as the target taskTitle.` : ''}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: transcript }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            { text: systemInstructionText }
          ]
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'navigatePage',
                description: 'Navigate the user to a different page route in the workspace dashboard.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    page: { 
                      type: 'STRING', 
                      enum: ['dashboard', 'tasks', 'settings', 'profile', 'login', 'register'],
                      description: 'The target page name route.'
                    }
                  },
                  required: ['page']
                }
              },
              {
                name: 'createTask',
                description: 'Create a new productivity task card in the workspace.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING', description: 'The title of the task.' },
                    description: { type: 'STRING', description: 'The description of the task or project association.' },
                    priority: { type: 'STRING', enum: ['low', 'medium', 'high'], description: 'Task priority.' },
                    category: { type: 'STRING', enum: ['general', 'design', 'development', 'backend', 'content', 'meeting'], description: 'Category tag.' }
                  },
                  required: ['title']
                }
              },
              {
                name: 'updateTask',
                description: "Update a task's field (such as title, description, status, priority, category, or dueDate).",
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    taskTitle: { type: 'STRING', description: 'The title of the task to update.' },
                    field: { type: 'STRING', enum: ['title', 'description', 'status', 'priority', 'category', 'dueDate'], description: 'The field to update.' },
                    value: { type: 'STRING', description: 'The new value of the field. For status, it must be one of: todo, in_progress, review, done. For dueDate, it should be an ISO date/time string. For priority: low, medium, high.' }
                  },
                  required: ['taskTitle', 'field', 'value']
                }
              },
              {
                name: 'askDeleteConfirmation',
                description: 'Ask the user to confirm deletion of a task.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    taskTitle: { type: 'STRING', description: 'The title of the task to delete.' }
                  },
                  required: ['taskTitle']
                }
              },
              {
                name: 'askEditDetails',
                description: 'Ask the user what details they would like to change/edit in a task.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    taskTitle: { type: 'STRING', description: 'The title of the task to edit.' }
                  },
                  required: ['taskTitle']
                }
              },
              {
                name: 'deleteTask',
                description: 'Delete a task from the workspace.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    taskTitle: { type: 'STRING', description: 'The title of the task to delete.' }
                  },
                  required: ['taskTitle']
                }
              },
              {
                name: 'loginOAuth',
                description: 'Triggers mock social OAuth login on the authentication page.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    provider: { type: 'STRING', enum: ['google', 'apple', 'facebook'], description: 'The provider name.' }
                  },
                  required: ['provider']
                }
              },
              {
                name: 'logout',
                description: 'Log the user out of the current active session.',
                parameters: {
                  type: 'OBJECT',
                  properties: {}
                }
              },
              {
                name: 'openTaskModal',
                description: 'Open the new task creation popup or dialog modal overlay on the tasks page.',
                parameters: {
                  type: 'OBJECT',
                  properties: {}
                }
              },
              {
                name: 'loginEmail',
                description: 'Triggers passwordless email login modal on the authentication page.',
                parameters: {
                  type: 'OBJECT',
                  properties: {}
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const candidate = data.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      // Check if Gemini selected a function call tool
      if (part && part.functionCall) {
        const functionCall = part.functionCall;
        const name = functionCall.name;
        const args = functionCall.args || {};

        console.log(`[GEMINI TOOL CALL SELECT] Name: ${name}, Args:`, args);

        let responseText = '';
        if (name === 'navigatePage') {
          responseText = `Confirming. Navigating to ${args.page}.`;
        } else if (name === 'createTask') {
          responseText = `Confirming. Creating task: "${args.title}".`;
        } else if (name === 'loginOAuth') {
          responseText = `Confirming. Logging in with ${args.provider}.`;
        } else if (name === 'logout') {
          responseText = 'Confirming. Logging out of your workspace.';
        } else if (name === 'openTaskModal') {
          responseText = 'Confirming. Opening new task dialog.';
        } else if (name === 'loginEmail') {
          responseText = 'Confirming. Opening email sign in.';
        } else if (name === 'askDeleteConfirmation') {
          responseText = 'Are you sure need to delete?';
        } else if (name === 'askEditDetails') {
          responseText = 'What would you like to change?';
        } else if (name === 'updateTask') {
          if (args.field === 'dueDate') {
            responseText = 'Confirming. Changing due date.';
          } else {
            responseText = `Confirming. Updating ${args.field} to ${args.value}.`;
          }
        } else if (name === 'deleteTask') {
          responseText = `Confirming. Deleting task: "${args.taskTitle}".`;
        }

        return res.status(200).json({
          action: name,
          parameters: args,
          response: responseText
        });
      }

      // Otherwise return conversational response text
      if (part && part.text) {
        return res.status(200).json({
          action: 'none',
          parameters: {},
          response: part.text.trim()
        });
      }

      // Fallback if structure parsing fails
      const fallback = localIntentParser(transcript, context);
      res.status(200).json(fallback);

    } catch (apiError) {
      console.error('[GEMINI API ERROR]', apiError.message);
      // Fallback on request failure
      const localResult = localIntentParser(transcript, context);
      res.status(200).json(localResult);
    }

  } catch (error) {
    next(error);
  }
};
