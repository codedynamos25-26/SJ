CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"difficulty" text NOT NULL,
	"xp" integer NOT NULL,
	"pool" integer NOT NULL,
	"completions" integer DEFAULT 0 NOT NULL,
	"participants" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"slots" integer NOT NULL,
	"total" integer NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"location" text NOT NULL,
	"accent" text DEFAULT '#d3ef57' NOT NULL,
	"image" text,
	"platform" text,
	"external_url" text
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" text PRIMARY KEY NOT NULL,
	"tag" text NOT NULL,
	"year" text NOT NULL,
	"label" text NOT NULL,
	"span" text DEFAULT '' NOT NULL,
	"img" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'Beta' NOT NULL,
	"tech" text[] DEFAULT '{}' NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"img" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"department" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"category" text DEFAULT 'Core' NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "user_active_challenges" (
	"user_id" text NOT NULL,
	"challenge_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_enrolled_events" (
	"user_id" text NOT NULL,
	"event_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"password_hash" text,
	"google_id" text,
	"xp" integer DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"usn" text,
	"department" text,
	"year" text,
	"github_url" text,
	"leetcode_url" text,
	"leetcode_rating" integer DEFAULT 0 NOT NULL,
	"track" text DEFAULT 'Fullstack' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "user_active_challenges" ADD CONSTRAINT "user_active_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_active_challenges" ADD CONSTRAINT "user_active_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrolled_events" ADD CONSTRAINT "user_enrolled_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_enrolled_events" ADD CONSTRAINT "user_enrolled_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;