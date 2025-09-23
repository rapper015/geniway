import { NextResponse } from 'next/server';
import { SimpleOrchestrator } from '../../../lib/orchestrator/SimpleOrchestrator.js';
import jwt from 'jsonwebtoken';

// Initialize the simple orchestrator
const orchestrator = new SimpleOrchestrator();

// POST endpoint for SSE streaming with body data
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, message, messageType = 'text', imageUrl, userId, guestProfile, language } = body;
    

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
            guestProfile: guestProfile || undefined, // Include guest profile data
            language: language || 'english', // Pass language preference
            subject: 'general'
          };

          await orchestrator.processStudentInput(
            sessionId,
            studentInput,
            (event) => {
              // Send event to client
              const eventData = `data: ${JSON.stringify({
                type: event.type,
                data: event.data,
                timestamp: event.timestamp.toISOString(),
                sessionId: event.sessionId
              })}\n\n`;
              controller.enqueue(encoder.encode(eventData));
            }
          );

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
    const language = searchParams.get('language');
    

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
              userId: userId || 'anonymous',
              language: language || 'english', // Pass language preference
              subject: 'general'
            };

            await orchestrator.processStudentInput(
              sessionId,
              studentInput,
              (event) => {
                // Send event to client
                const eventData = `data: ${JSON.stringify({
                  type: event.type,
                  data: event.data,
                  timestamp: event.timestamp.toISOString(),
                  sessionId: event.sessionId
                })}\n\n`;
                controller.enqueue(encoder.encode(eventData));
              }
            );

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
            
            // Send error event
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              data: {
                error: error.message || 'Unknown error occurred',
                code: 'PROCESSING_ERROR',
                retryable: true
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
