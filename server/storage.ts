import { db } from "./db";
import {
  instructors, sectors, instructorSectors, meetings, attendances, settings,
  type Instructor, type Sector, type Meeting, type Attendance, type Setting,
  type CreateInstructorRequest, type UpdateInstructorRequest, type InstructorWithSectors,
  type CreateSectorRequest, type UpdateSectorRequest, type BulkUpdateAttendanceRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getInstructors(): Promise<InstructorWithSectors[]>;
  getInstructor(id: number): Promise<InstructorWithSectors | undefined>;
  createInstructor(data: CreateInstructorRequest): Promise<InstructorWithSectors>;
  updateInstructor(id: number, data: UpdateInstructorRequest): Promise<InstructorWithSectors | undefined>;
  deleteInstructor(id: number): Promise<void>;

  getSectors(): Promise<Sector[]>;
  createSector(data: CreateSectorRequest): Promise<Sector>;
  updateSector(id: number, data: UpdateSectorRequest): Promise<Sector>;
  deleteSector(id: number): Promise<void>;

  getMeetings(): Promise<MeetingWithSector[]>;
  getMeeting(id: number): Promise<MeetingWithSector | undefined>;
  createMeeting(date: string, name?: string, sectorId?: number): Promise<Meeting>;
  updateMeeting(id: number, data: UpdateMeetingRequest): Promise<MeetingWithSector | undefined>;

  getAttendances(): Promise<Attendance[]>;
  getAttendancesByMeeting(meetingId: number): Promise<Attendance[]>;
  bulkUpdateAttendances(meetingId: number, data: BulkUpdateAttendanceRequest): Promise<void>;

  getSettings(): Promise<Setting>;
  updateSettings(minimumAttendance: number): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  async getInstructors(): Promise<InstructorWithSectors[]> {
    return await db.query.instructors.findMany({
      with: {
        sectors: {
          with: {
            sector: true
          }
        }
      },
      orderBy: (instructors, { asc }) => [asc(instructors.name)]
    });
  }

  async getInstructor(id: number): Promise<InstructorWithSectors | undefined> {
    return await db.query.instructors.findFirst({
      where: eq(instructors.id, id),
      with: {
        sectors: {
          with: {
            sector: true
          }
        }
      }
    });
  }

  async createInstructor(data: CreateInstructorRequest): Promise<InstructorWithSectors> {
    const [instructor] = await db.insert(instructors).values({
      name: data.name,
      active: data.active ?? true,
    }).returning();

    if (data.sectorIds && data.sectorIds.length > 0) {
      await db.insert(instructorSectors).values(
        data.sectorIds.map(sectorId => ({ instructorId: instructor.id, sectorId }))
      );
    }

    return (await this.getInstructor(instructor.id))!;
  }

  async updateInstructor(id: number, data: UpdateInstructorRequest): Promise<InstructorWithSectors | undefined> {
    if (data.name !== undefined || data.active !== undefined) {
      await db.update(instructors)
        .set({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.active !== undefined ? { active: data.active } : {}),
        })
        .where(eq(instructors.id, id));
    }

    if (data.sectorIds !== undefined) {
      await db.delete(instructorSectors).where(eq(instructorSectors.instructorId, id));
      if (data.sectorIds.length > 0) {
        await db.insert(instructorSectors).values(
          data.sectorIds.map(sectorId => ({ instructorId: id, sectorId }))
        );
      }
    }

    return await this.getInstructor(id);
  }

  async deleteInstructor(id: number): Promise<void> {
    await db.delete(instructors).where(eq(instructors.id, id));
  }

  async getSectors(): Promise<Sector[]> {
    return await db.select().from(sectors).orderBy(sectors.name);
  }

  async createSector(data: CreateSectorRequest): Promise<Sector> {
    const [sector] = await db.insert(sectors).values(data).returning();
    return sector;
  }

  async updateSector(id: number, data: UpdateSectorRequest): Promise<Sector> {
    const [sector] = await db.update(sectors).set(data).where(eq(sectors.id, id)).returning();
    return sector;
  }

  async deleteSector(id: number): Promise<void> {
    await db.delete(sectors).where(eq(sectors.id, id));
  }

  async getMeetings(): Promise<MeetingWithSector[]> {
    return await db.query.meetings.findMany({
      with: { sector: true },
      orderBy: (meetings, { asc }) => [asc(meetings.date)]
    });
  }

  async getMeeting(id: number): Promise<MeetingWithSector | undefined> {
    return await db.query.meetings.findFirst({
      where: eq(meetings.id, id),
      with: { sector: true }
    });
  }

  async createMeeting(date: string, name?: string, sectorId?: number): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values({ date, name, sectorId }).returning();
    return meeting;
  }

  async updateMeeting(id: number, data: UpdateMeetingRequest): Promise<MeetingWithSector | undefined> {
    await db.update(meetings).set(data).where(eq(meetings.id, id));
    return await this.getMeeting(id);
  }

  async getAttendances(): Promise<Attendance[]> {
    return await db.select().from(attendances);
  }

  async getAttendancesByMeeting(meetingId: number): Promise<Attendance[]> {
    return await db.select().from(attendances).where(eq(attendances.meetingId, meetingId));
  }

  async bulkUpdateAttendances(meetingId: number, data: BulkUpdateAttendanceRequest): Promise<void> {
    for (const att of data.attendances) {
      const existing = await db.select().from(attendances).where(
        and(
          eq(attendances.meetingId, meetingId),
          eq(attendances.instructorId, att.instructorId)
        )
      ).limit(1);

      if (existing.length > 0) {
        await db.update(attendances)
          .set({ status: att.status, observation: att.observation, updatedAt: new Date() })
          .where(eq(attendances.id, existing[0].id));
      } else {
        await db.insert(attendances).values({
          meetingId,
          instructorId: att.instructorId,
          status: att.status,
          observation: att.observation,
        });
      }
    }
  }

  async getSettings(): Promise<Setting> {
    let [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      [setting] = await db.insert(settings).values({ minimumAttendance: 80 }).returning();
    }
    return setting;
  }

  async updateSettings(minimumAttendance: number): Promise<Setting> {
    const setting = await this.getSettings();
    const [updated] = await db.update(settings).set({ minimumAttendance }).where(eq(settings.id, setting.id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
