import { NextResponse } from 'next/server';
import { SimpleOrchestrator } from '../../../lib/orchestrator/SimpleOrchestrator.js';
import ChatSessionNew from '../../../../models/ChatSessionNew';
import jwt from 'jsonwebtoken';

// Initialize the simple orchestrator
const orchestrator = new SimpleOrchestrator();

// POST endpoint for SSE streaming with body data
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, message, messageType = 'text', imageUrl, userId, language } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection event
      const initialEvent = `data: ${JSON.stringify({
        type: 'connection',
        data: { status: 'connected', sessionId },
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(initialEvent));

      // Process the student input
      const processInput = async () => {
        try {
          const studentInput = {
            text: message,
            type: messageType,
            imageUrl: imageUrl || undefined,
            timestamp: new Date(),
            userId: userId || 'anonymous', // Use actual user ID from request
            subject: 'general'
          };

          // Call the chat API instead of orchestrator directly
          console.log('[Solve API] Calling chat API with sessionId:', sessionId);
          const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: studentInput.text,
              messageType: studentInput.type,
              imageUrl: studentInput.imageUrl,
              sessionId: sessionId,
              userId: studentInput.userId,
              subject: studentInput.subject,
              language: language
            })
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            
            // Send AI response event
            const aiEvent = `data: ${JSON.stringify({
              type: 'ai_response',
              data: {
                content: chatData.aiMessage.content,
                messageId: chatData.aiMessage.id
              },
              timestamp: new Date().toISOString(),
              sessionId: sessionId
            })}\n\n`;
            controller.enqueue(encoder.encode(aiEvent));
          } else {
            const errorData = await chatResponse.json();
            console.error('[Solve API] Chat API error:', errorData);
            throw new Error(`Chat API error: ${chatResponse.status} - ${errorData.error || 'Unknown error'}`);
          }

          // Send completion event
          const completionEvent = `data: ${JSON.stringify({
            type: 'complete',
            data: { status: 'completed' },
            timestamp: new Date().toISOString(),
            sessionId
          })}\n\n`;
          controller.enqueue(encoder.encode(completionEvent));

        } catch (error) {
          console.error('[Solve API] Error processing input:', error);
          console.error('[Solve API] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
          });
          
          // Send error event with more details
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            data: {
              error: error.message || 'Unknown error occurred',
              code: 'PROCESSING_ERROR',
              retryable: true,
              details: {
                name: error.name,
                code: error.code,
                stack: error.stack
              }
            },
            timestamp: new Date().toISOString(),
            sessionId
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          // Close the stream
          controller.close();
        }
      };

      processInput();
    }
  });

      return new Response(stream, { headers });
    } catch (error) {
      console.error('[Solve API] Error in POST request:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // GET endpoint for backward compatibility (deprecated)
  export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const message = searchParams.get('message');
    const messageType = searchParams.get('type') || 'text';
    const imageUrl = searchParams.get('imageUrl');
    const userId = searchParams.get('userId');
    const language = searchParams.get('language') || 'english';

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // If no sessionId provided, create a simple sessionId (let chat API handle session creation)
    let actualSessionId = sessionId;
    console.log('[Solve API] Initial sessionId:', sessionId, 'userId:', userId);
    if (!actualSessionId && userId) {
      // Create a simple sessionId and let the chat API create the actual session
      actualSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[Solve API] Created simple sessionId:', actualSessionId);
    }
    console.log('[Solve API] Final actualSessionId:', actualSessionId);

    // Ensure we have a valid sessionId
    if (!actualSessionId) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve session ID' },
        { status: 500 }
      );
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection event
        const initialEvent = `data: ${JSON.stringify({
          type: 'connection',
          data: { status: 'connected', sessionId: actualSessionId },
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(encoder.encode(initialEvent));

        // Process the student input
        const processInput = async () => {
          try {
            const studentInput = {
              text: message,
              type: messageType,
              imageUrl: imageUrl || undefined,
              timestamp: new Date(),
              userId: userId || 'anonymous',
              subject: 'general'
            };

            // Call the chat API instead of orchestrator directly
            console.log('[Solve API GET] Calling chat API with actualSessionId:', actualSessionId);
            const requestBody = {
              message: studentInput.text,
              messageType: studentInput.type,
              imageUrl: studentInput.imageUrl,
              sessionId: actualSessionId,
              userId: studentInput.userId,
              subject: studentInput.subject,
                language: language
            };
            
            const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });

            if (chatResponse.ok) {
              const chatData = await chatResponse.json();
              
              // Send AI response event
              const aiEvent = `data: ${JSON.stringify({
                type: 'ai_response',
                data: {
                  content: chatData.aiMessage.content,
                  messageId: chatData.aiMessage.id
                },
                timestamp: new Date().toISOString(),
                sessionId: actualSessionId
              })}\n\n`;
              controller.enqueue(encoder.encode(aiEvent));
            } else {
              const errorData = await chatResponse.json();
              console.error('[Solve API] Chat API error:', errorData);
              throw new Error(`Chat API error: ${chatResponse.status} - ${errorData.error || 'Unknown error'}`);
            }

            // Send completion event
            const completionEvent = `data: ${JSON.stringify({
              type: 'complete',
              data: { status: 'completed' },
              timestamp: new Date().toISOString(),
              sessionId: actualSessionId
            })}\n\n`;
            controller.enqueue(encoder.encode(completionEvent));

          } catch (error) {
            console.error('[Solve API] Error processing input:', error);
            
            // Send error event
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              data: {
                error: error.message || 'Unknown error occurred',
                code: 'PROCESSING_ERROR',
                retryable: true
              },
              timestamp: new Date().toISOString(),
              sessionId: actualSessionId
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
          } finally {
            // Close the stream
            controller.close();
          }
        };

        processInput();
      }
    });

    return new Response(stream, { headers });
  }

  // Legacy POST endpoint for non-streaming requests
  export async function POST_LEGACY(request) {
  try {
    const { sessionId, message, type = 'text', imageUrl } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    const studentInput = {
      text: message,
      type,
      imageUrl: imageUrl || undefined,
      timestamp: new Date(),
      metadata: {}
    };

    const result = await orchestrator.processStudentInput(sessionId, studentInput);

    if (result.success) {
      return NextResponse.json({
        success: true,
        sections: result.sections,
        sessionId
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Solve API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
