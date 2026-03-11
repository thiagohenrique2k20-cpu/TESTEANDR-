import { z } from 'zod';
import { insertInstructorSchema, insertSectorSchema, insertSettingSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  instructors: {
    list: {
      method: 'GET' as const,
      path: '/api/instructors' as const,
      responses: { 200: z.any() },
    },
    get: {
      method: 'GET' as const,
      path: '/api/instructors/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/instructors' as const,
      input: insertInstructorSchema.extend({ sectorIds: z.array(z.number()) }),
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/instructors/:id' as const,
      input: insertInstructorSchema.partial().extend({ sectorIds: z.array(z.number()).optional() }),
      responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/instructors/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },
  sectors: {
    list: {
      method: 'GET' as const,
      path: '/api/sectors' as const,
      responses: { 200: z.any() },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sectors' as const,
      input: insertSectorSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/sectors/:id' as const,
      input: insertSectorSchema.partial(),
      responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/sectors/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },
  meetings: {
    list: {
      method: 'GET' as const,
      path: '/api/meetings' as const,
      responses: { 200: z.any() },
    },
  },
  attendances: {
    list: {
      method: 'GET' as const,
      path: '/api/attendances' as const,
      responses: { 200: z.any() },
    },
    bulkUpdate: {
      method: 'POST' as const,
      path: '/api/meetings/:meetingId/attendances/bulk' as const,
      input: z.object({
        attendances: z.array(z.object({
          instructorId: z.number(),
          status: z.enum(['present', 'absent', 'justified', 'na']),
          observation: z.string().optional().nullable(),
        })),
      }),
      responses: { 200: z.any(), 400: errorSchemas.validation },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings' as const,
      responses: { 200: z.any() },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings' as const,
      input: insertSettingSchema.pick({ minimumAttendance: true }),
      responses: { 200: z.any(), 400: errorSchemas.validation },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}