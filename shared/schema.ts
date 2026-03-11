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

export const meetingTypes = pgTable("meeting_types", {
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
  name: text("name"),
  date: date("date").notNull(),
  sectorId: integer("sector_id").references(() => sectors.id, { onDelete: 'set null' }),
  meetingTypeId: integer("meeting_type_id").references(() => meetingTypes.id, { onDelete: 'set null' }),
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
  meetings: many(meetings),
}));

export const meetingTypesRelations = relations(meetingTypes, ({ many }) => ({
  meetings: many(meetings),
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

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  attendances: many(attendances),
  sector: one(sectors, {
    fields: [meetings.sectorId],
    references: [sectors.id],
  }),
  meetingType: one(meetingTypes, {
    fields: [meetings.meetingTypeId],
    references: [meetingTypes.id],
  }),
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
export const insertMeetingTypeSchema = createInsertSchema(meetingTypes).omit({ id: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendances).omit({ id: true, updatedAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export type Instructor = typeof instructors.$inferSelect;
export type Sector = typeof sectors.$inferSelect;
export type MeetingType = typeof meetingTypes.$inferSelect;
export type InstructorSector = typeof instructorSectors.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type MeetingWithSector = Meeting & {
  sector?: Sector | null;
  meetingType?: MeetingType | null;
};

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

export type CreateMeetingTypeRequest = z.infer<typeof insertMeetingTypeSchema>;

export type UpdateMeetingRequest = Partial<z.infer<typeof insertMeetingSchema>>;

export type BulkUpdateAttendanceRequest = {
  attendances: {
    instructorId: number;
    status: string;
    observation?: string | null;
  }[];
};
