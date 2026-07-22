import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const diagnostics = sqliteTable("diagnostics", {
  id: integer("id").primaryKey({ autoIncrement: true }), studentName: text("student_name").notNull(),
  grade: text("grade").notNull(), recentScore: text("recent_score").notNull(), scoreTotal: text("score_total").notNull(),
  learningIssue: text("learning_issue").notNull(), phone: text("phone").notNull(),
  estimatedVocabulary: integer("estimated_vocabulary").notNull(), accuracyRate: integer("accuracy_rate").notNull(),
  weakestArea: text("weakest_area").notNull(), abilityScores: text("ability_scores").notNull(),
  wrongWords: text("wrong_words").notNull().default("[]"), source: text("source").notNull().default("internal-test"),
  followUpStatus: text("follow_up_status").notNull().default("未跟进"), followUpNote: text("follow_up_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
