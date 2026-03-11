import { pgTable, text, serial, integer, boolean, timestamp, date, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const instructorSectors = pgTable("instructor_sectors", {
  instructorId: integer("instructor_id").notNull().references(() => instructors.id, { onDelete: 'cascade' }),
  sectorId: integer("sector_id").notNull().references(() => sectors.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.instructorId, t.sectorId] }),
}));

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // YYYY-MM-DD
});

export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  instructorId: integer("instructor_id").notNull().references(() => instructors.id, { onDelete: 'cascade' }),
  status: text("status").notNull(), // 'present', 'absent', 'justified', 'na'
  observation: text("observation"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  minimumAttendance: integer("minimum_attendance").default(80).notNull(),
});

export const instructorsRelations = relations(instructors, ({ many }) => ({
  sectors: many(instructorSectors),
  attendances: many(attendances),
}));

export const sectorsRelations = relations(sectors, ({ many }) => ({
  instructors: many(instructorSectors),
}));

export const instructorSectorsRelations = relations(instructorSectors, ({ one }) => ({
  instructor: one(instructors, {
    fields: [instructorSectors.instructorId],
    references: [instructors.id],
  }),
  sector: one(sectors, {
    fields: [instructorSectors.sectorId],
    references: [sectors.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ many }) => ({
  attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  meeting: one(meetings, {
    fields: [attendances.meetingId],
    references: [meetings.id],
  }),
  instructor: one(instructors, {
    fields: [attendances.instructorId],
    references: [instructors.id],
  }),
}));

export const insertInstructorSchema = createInsertSchema(instructors).omit({ id: true });
export const insertSectorSchema = createInsertSchema(sectors).omit({ id: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendances).omit({ id: true, updatedAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export type Instructor = typeof instructors.$inferSelect;
export type Sector = typeof sectors.$inferSelect;
export type InstructorSector = typeof instructorSectors.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type InstructorWithSectors = Instructor & {
  sectors: { sector: Sector }[];
};

export type AttendanceWithDetails = Attendance & {
  instructor?: Instructor;
  meeting?: Meeting;
};

export type CreateInstructorRequest = z.infer<typeof insertInstructorSchema> & { sectorIds: number[] };
export type UpdateInstructorRequest = Partial<CreateInstructorRequest>;

export type CreateSectorRequest = z.infer<typeof insertSectorSchema>;
export type UpdateSectorRequest = Partial<CreateSectorRequest>;

export type BulkUpdateAttendanceRequest = {
  attendances: {
    instructorId: number;
    status: string;
    observation?: string | null;
  }[];
};
