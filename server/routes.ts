import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function getNextMondaysAndFridays(count: number): string[] {
  const dates: string[] = [];
  let d = new Date();
  while (dates.length < count) {
    const day = d.getDay();
    if (day === 1 || day === 5) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

async function seedDatabase() {
  const existingMeetings = await storage.getMeetings();
  if (existingMeetings.length === 0) {
    const dates = getNextMondaysAndFridays(20);
    for (const d of dates) {
      await storage.createMeeting(d);
    }

    const s1 = await storage.createSector({ name: "Engenharia" });
    const s2 = await storage.createSector({ name: "Design" });

    const i1 = await storage.createInstructor({ name: "João Silva", active: true, sectorIds: [s1.id] });
    const i2 = await storage.createInstructor({ name: "Maria Santos", active: true, sectorIds: [s1.id, s2.id] });
    const i3 = await storage.createInstructor({ name: "Carlos Gomes", active: true, sectorIds: [s2.id] });

    const meetingsList = await storage.getMeetings();
    const pastMeeting = meetingsList[0];

    await storage.bulkUpdateAttendances(pastMeeting.id, {
      attendances: [
        { instructorId: i1.id, status: 'present' },
        { instructorId: i2.id, status: 'absent' },
        { instructorId: i3.id, status: 'justified', observation: 'Problemas de internet' }
      ]
    });
  }

  // Seed meeting types if none exist
  const existingTypes = await storage.getMeetingTypes();
  if (existingTypes.length === 0) {
    const initialTypes = ['Ginastica', 'Bike', 'Musculação', 'Tecnologia', 'Comunicação'];
    for (const name of initialTypes) {
      await storage.createMeetingType({ name });
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  seedDatabase().catch(console.error);

  // Instructors
  app.get(api.instructors.list.path, async (req, res) => {
    const instructors = await storage.getInstructors();
    res.json(instructors);
  });

  app.get(api.instructors.get.path, async (req, res) => {
    const instructor = await storage.getInstructor(Number(req.params.id));
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    res.json(instructor);
  });

  app.post(api.instructors.create.path, async (req, res) => {
    try {
      const input = api.instructors.create.input.parse(req.body);
      const instructor = await storage.createInstructor(input);
      res.status(201).json(instructor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.instructors.update.path, async (req, res) => {
    try {
      const input = api.instructors.update.input.parse(req.body);
      const instructor = await storage.updateInstructor(Number(req.params.id), input);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
      res.json(instructor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.instructors.delete.path, async (req, res) => {
    await storage.deleteInstructor(Number(req.params.id));
    res.status(204).end();
  });

  // Sectors
  app.get(api.sectors.list.path, async (req, res) => {
    const sectors = await storage.getSectors();
    res.json(sectors);
  });

  app.post(api.sectors.create.path, async (req, res) => {
    try {
      const input = api.sectors.create.input.parse(req.body);
      const sector = await storage.createSector(input);
      res.status(201).json(sector);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.sectors.update.path, async (req, res) => {
    try {
      const input = api.sectors.update.input.parse(req.body);
      const sector = await storage.updateSector(Number(req.params.id), input);
      res.json(sector);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.sectors.delete.path, async (req, res) => {
    await storage.deleteSector(Number(req.params.id));
    res.status(204).end();
  });

  // Meeting Types
  app.get(api.meetingTypes.list.path, async (req, res) => {
    const types = await storage.getMeetingTypes();
    res.json(types);
  });

  app.post(api.meetingTypes.create.path, async (req, res) => {
    try {
      const input = api.meetingTypes.create.input.parse(req.body);
      const type = await storage.createMeetingType(input);
      res.status(201).json(type);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.meetingTypes.delete.path, async (req, res) => {
    await storage.deleteMeetingType(Number(req.params.id));
    res.status(204).end();
  });

  // Meetings
  app.get(api.meetings.list.path, async (req, res) => {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  });

  app.patch(api.meetings.update.path, async (req, res) => {
    try {
      const input = api.meetings.update.input.parse(req.body);
      const meeting = await storage.updateMeeting(Number(req.params.id), input);
      if (!meeting) return res.status(404).json({ message: "Meeting not found" });
      res.json(meeting);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Attendances
  app.get(api.attendances.list.path, async (req, res) => {
    const attendances = await storage.getAttendances();
    res.json(attendances);
  });

  app.post(api.attendances.bulkUpdate.path, async (req, res) => {
    try {
      const input = api.attendances.bulkUpdate.input.parse(req.body);
      await storage.bulkUpdateAttendances(Number(req.params.meetingId), input);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Settings
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateSettings(input.minimumAttendance);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  return httpServer;
}
