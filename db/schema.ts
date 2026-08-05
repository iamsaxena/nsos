import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  duration: text("duration").notNull(),
  format: text("format").notNull().default("Live on Zoom"),
  mrp: integer("mrp").notNull(),
  offerPrice: integer("offer_price").notNull(),
  capacity: integer("capacity").notNull().default(30),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  imageKey: text("image_key"),
  speakerName: text("speaker_name"),
  speakerTitle: text("speaker_title"),
  speakerExperience: text("speaker_experience"),
  speakerBio: text("speaker_bio"),
  speakerPhotoKey: text("speaker_photo_key"),
  presentationKey: text("presentation_key"),
  recordingKey: text("recording_key"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_events_status_date").on(table.status, table.eventDate)]);

export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  dateOfBirth: text("date_of_birth"),
  occupation: text("occupation"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  paymentStatus: text("payment_status", { enum: ["created", "paid", "failed", "refunded"] }).notNull().default("created"),
  attendanceStatus: text("attendance_status", { enum: ["pending", "attended", "absent"] }).notNull().default("pending"),
  certificateEligibleAt: text("certificate_eligible_at"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_enrollments_event_id").on(table.eventId)]);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  hits: integer("hits").notNull().default(1),
});
