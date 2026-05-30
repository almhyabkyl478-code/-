import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leavesTable = pgTable("leaves", {
  id: serial("id").primaryKey(),
  leaveCode: text("leave_code").notNull().unique(),
  idNumber: text("id_number").notNull(),
  patientNameAr: text("patient_name_ar").notNull(),
  patientNameEn: text("patient_name_en").notNull(),
  nationalityAr: text("nationality_ar"),
  nationalityEn: text("nationality_en"),
  employerAr: text("employer_ar"),
  employerEn: text("employer_en"),
  doctorNameAr: text("doctor_name_ar").notNull(),
  doctorNameEn: text("doctor_name_en").notNull(),
  positionAr: text("position_ar"),
  positionEn: text("position_en"),
  admissionDateGregorian: text("admission_date_gregorian").notNull(),
  admissionDateHijri: text("admission_date_hijri"),
  dischargeDateGregorian: text("discharge_date_gregorian").notNull(),
  dischargeDateHijri: text("discharge_date_hijri"),
  issueDate: text("issue_date").notNull(),
  hospitalNameAr: text("hospital_name_ar").notNull(),
  hospitalNameEn: text("hospital_name_en").notNull(),
  reportTime: text("report_time"),
  durationDays: integer("duration_days"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeaveSchema = createInsertSchema(leavesTable).omit({ id: true, createdAt: true });
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leavesTable.$inferSelect;
