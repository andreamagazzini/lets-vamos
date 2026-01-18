import { NextResponse } from 'next/server';

/**
 * OpenAPI 3.1 specification for Let's Vamos API
 * This spec is manually maintained. When adding new endpoints, update this file.
 */
export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: "Let's Vamos API",
      version: '2.0.0',
      description:
        'API for managing training groups and workouts. All endpoints require Clerk authentication.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk authentication token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
          required: ['error'],
        },
        Group: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId (used as groupId)' },
            name: { type: 'string', minLength: 1 },
            createdBy: { type: 'string', description: 'Clerk user ID of the creator' },
            emoji: { type: 'string' },
            backgroundImage: { type: 'string' },
            goalType: { type: 'string', minLength: 1 },
            goalDate: { type: 'string', minLength: 1 },
            inviteCode: { type: 'string', minLength: 1 },
            trainingPlan: {
              type: 'object',
              description: 'Weekly training plan (Mon-Sun)',
              additionalProperties: {
                type: 'array',
                items: {
                  oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/PlannedWorkout' }],
                },
              },
            },
            weeklyPlanOverrides: {
              type: 'object',
              description: 'Week-specific plan overrides',
              additionalProperties: { $ref: '#/components/schemas/WeeklyPlan' },
            },
            planSettings: { $ref: '#/components/schemas/GroupPlanSettings' },
            workoutTypes: {
              type: 'array',
              items: { type: 'string' },
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Soft delete timestamp',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['name', 'createdBy', 'goalType', 'goalDate', 'inviteCode'],
        },
        Member: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            groupId: { type: 'string', description: 'MongoDB group _id' },
            userId: { type: 'string', description: 'Clerk user ID' },
            displayName: {
              type: 'string',
              description: 'Display name (group-specific or from Clerk firstName/lastName/email)',
            },
            role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['groupId', 'userId', 'displayName', 'role'],
        },
        CreateMemberInput: {
          type: 'object',
          properties: {
            groupId: { type: 'string', description: 'MongoDB group _id' },
            displayName: { type: 'string', description: 'Display name for the member' },
          },
          required: ['groupId'],
        },
        PlannedWorkout: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            amount: { type: 'number' },
            unit: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        WeeklyPlan: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/PlannedWorkout' }],
            },
          },
        },
        GroupPlanSettings: {
          type: 'object',
          properties: {
            displayStyle: {
              type: 'string',
              enum: ['compact', 'expanded', 'detailed'],
              default: 'expanded',
            },
            showIcons: { type: 'boolean', default: true },
            showDetails: { type: 'boolean', default: true },
            colorTheme: {
              type: 'string',
              enum: ['default', 'minimal', 'vibrant'],
              default: 'default',
            },
            highlightToday: { type: 'boolean', default: true },
          },
        },
        CreateGroupInput: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            goalType: { type: 'string', minLength: 1 },
            goalDate: { type: 'string', minLength: 1 },
            inviteCode: { type: 'string', minLength: 1 },
            displayName: {
              type: 'string',
              description: 'Display name for the creator (admin member)',
            },
          },
          required: ['name', 'goalType', 'goalDate', 'inviteCode'],
        },
        UpdateGroupInput: {
          type: 'object',
          properties: {
            groupId: { type: 'string', description: 'MongoDB group _id' },
            name: { type: 'string' },
            emoji: { type: 'string' },
            backgroundImage: { type: 'string' },
            goalType: { type: 'string' },
            goalDate: { type: 'string' },
            trainingPlan: { $ref: '#/components/schemas/WeeklyPlan' },
            weeklyPlanOverrides: {
              type: 'object',
              additionalProperties: { $ref: '#/components/schemas/WeeklyPlan' },
            },
            planSettings: { $ref: '#/components/schemas/GroupPlanSettings' },
            workoutTypes: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['groupId'],
        },
        Workout: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            groupId: { type: 'string', description: 'MongoDB group _id' },
            userId: { type: 'string', description: 'Clerk user ID' },
            type: { type: 'string', minLength: 1 },
            duration: { type: 'number', description: 'Duration in minutes' },
            amount: { type: 'number' },
            unit: { type: 'string' },
            notes: { type: 'string' },
            date: { type: 'string', format: 'date' },
            calories: { type: 'number' },
            avgHeartRate: { type: 'number' },
            intervals: {
              type: 'array',
              items: { $ref: '#/components/schemas/Interval' },
            },
            avgSpeed: { type: 'number', description: 'km/h' },
            distancePer100m: { type: 'number', description: 'seconds per 100m' },
            laps: { type: 'number' },
            poolLength: { type: 'number', description: 'meters' },
            exercises: {
              type: 'array',
              items: { $ref: '#/components/schemas/Exercise' },
            },
            distance: { type: 'number', description: 'Legacy field (use amount/unit instead)' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['groupId', 'userId', 'type', 'date'],
        },
        Interval: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['warmup', 'work', 'cooldown', 'recovery'] },
            distance: { type: 'number' },
            time: { type: 'number', description: 'seconds' },
            pace: { type: 'number' },
            avgHeartRate: { type: 'number' },
            note: { type: 'string' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            sets: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkoutSet' },
            },
          },
          required: ['name', 'sets'],
        },
        WorkoutSet: {
          type: 'object',
          properties: {
            reps: { type: 'number' },
            weight: { type: 'number', description: 'kg' },
          },
        },
        CreateWorkoutInput: {
          type: 'object',
          properties: {
            groupId: { type: 'string', description: 'MongoDB group _id' },
            type: { type: 'string', minLength: 1 },
            date: { type: 'string', format: 'date' },
            duration: { type: 'number' },
            amount: { type: 'number' },
            unit: { type: 'string' },
            notes: { type: 'string' },
            calories: { type: 'number' },
            avgHeartRate: { type: 'number' },
            intervals: {
              type: 'array',
              items: { $ref: '#/components/schemas/Interval' },
            },
            avgSpeed: { type: 'number' },
            distancePer100m: { type: 'number' },
            laps: { type: 'number' },
            poolLength: { type: 'number' },
            exercises: {
              type: 'array',
              items: { $ref: '#/components/schemas/Exercise' },
            },
            distance: { type: 'number', description: 'Legacy field (use amount/unit instead)' },
          },
          required: ['groupId', 'type', 'date'],
        },
        UpdateWorkoutInput: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            date: { type: 'string', format: 'date' },
            duration: { type: 'number' },
            amount: { type: 'number' },
            unit: { type: 'string' },
            notes: { type: 'string' },
            calories: { type: 'number' },
            avgHeartRate: { type: 'number' },
            intervals: {
              type: 'array',
              items: { $ref: '#/components/schemas/Interval' },
            },
            avgSpeed: { type: 'number' },
            distancePer100m: { type: 'number' },
            laps: { type: 'number' },
            poolLength: { type: 'number' },
            exercises: {
              type: 'array',
              items: { $ref: '#/components/schemas/Exercise' },
            },
            distance: { type: 'number' },
          },
        },
      },
    },
    security: [{ ClerkAuth: [] }],
    paths: {
      '/api/groups': {
        get: {
          summary: 'Get groups for authenticated user',
          description:
            'Returns all groups for the authenticated user (created + joined). Optionally get a specific group by groupId query parameter.',
          tags: ['Groups'],
          parameters: [
            {
              name: 'groupId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Get a specific group by MongoDB _id',
            },
            {
              name: 'userId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Get all groups for a specific user (admin only)',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          group: { $ref: '#/components/schemas/Group' },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          groups: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Group' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new group',
          description:
            'Creates a new training group for the authenticated user. The creator is automatically added as an admin member.',
          tags: ['Groups'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateGroupInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Group created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      group: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request (e.g., group already exists)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update a group',
          description: 'Updates a group. Requires admin access to the group.',
          tags: ['Groups'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateGroupInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Group updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      group: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not admin)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Group not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/groups/{groupId}': {
        get: {
          summary: 'Get a specific group',
          description:
            'Returns a specific group by MongoDB _id. User must be a member of the group.',
          tags: ['Groups'],
          parameters: [
            {
              name: 'groupId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'MongoDB group _id',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      group: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not a member of this group)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Group not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/groups/invite/{inviteCode}': {
        get: {
          summary: 'Get group by invite code',
          description:
            'Returns minimal group information for joining via invite code. No authentication required.',
          tags: ['Groups'],
          security: [],
          parameters: [
            {
              name: 'inviteCode',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Group invite code',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      group: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', description: 'MongoDB ObjectId' },
                          name: { type: 'string' },
                          emoji: { type: 'string' },
                          goalType: { type: 'string' },
                          goalDate: { type: 'string' },
                          inviteCode: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Group not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/members': {
        get: {
          summary: 'Get members of a group',
          description: 'Returns all members of a group. User must be a member of the group.',
          tags: ['Members'],
          parameters: [
            {
              name: 'groupId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'MongoDB group _id',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      members: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Member' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request (groupId missing)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not a member of this group)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Join a group (create member)',
          description:
            'Adds the authenticated user as a member to a group. User must not already be a member.',
          tags: ['Members'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMemberInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Member created (user joined group)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      member: { $ref: '#/components/schemas/Member' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request (already a member or missing groupId)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/workouts': {
        get: {
          summary: 'Get workouts for a group',
          description:
            'Returns workouts for a group. User must be a member of the group. Optionally filter by userId.',
          tags: ['Workouts'],
          parameters: [
            {
              name: 'groupId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'MongoDB group _id',
            },
            {
              name: 'userId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Filter workouts by user ID',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workouts: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Workout' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request (groupId missing)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not a member of this group)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new workout',
          description:
            'Creates a new workout log for the authenticated user in a group. User must be a member of the group.',
          tags: ['Workouts'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateWorkoutInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Workout created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workout: { $ref: '#/components/schemas/Workout' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request (missing required fields)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/workouts/{workoutId}': {
        get: {
          summary: 'Get a specific workout',
          description: 'Returns a specific workout by ID.',
          tags: ['Workouts'],
          parameters: [
            {
              name: 'workoutId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Workout ID',
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workout: { $ref: '#/components/schemas/Workout' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Workout not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update a workout',
          description:
            'Updates a workout. Users can only update their own workouts unless they are group admins.',
          tags: ['Workouts'],
          parameters: [
            {
              name: 'workoutId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Workout ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateWorkoutInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Workout updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workout: { $ref: '#/components/schemas/Workout' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not owner or admin)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Workout not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Delete a workout',
          description:
            'Deletes a workout. Users can only delete their own workouts unless they are group admins.',
          tags: ['Workouts'],
          parameters: [
            {
              name: 'workoutId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Workout ID',
            },
          ],
          responses: {
            '200': {
              description: 'Workout deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden (not owner or admin)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Workout not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
