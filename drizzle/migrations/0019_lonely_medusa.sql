CREATE TABLE "opus_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "domain" NOT NULL,
	"name" text NOT NULL,
	"color" varchar(7) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opus_priorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "domain" NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "opus_priorities_domain_name_unique" UNIQUE("domain","name")
);
--> statement-breakpoint
CREATE TABLE "opus_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "domain" NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "opus_statuses_domain_name_unique" UNIQUE("domain","name")
);
--> statement-breakpoint
CREATE TABLE "opus_task_assignees" (
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "opus_task_assignees_task_id_user_id_pk" PRIMARY KEY("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "opus_task_labels" (
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "opus_task_labels_task_id_label_id_pk" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "opus_task_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"url" text NOT NULL,
	"label" text
);
--> statement-breakpoint
CREATE TABLE "opus_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "domain" NOT NULL,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status_id" uuid NOT NULL,
	"priority_id" uuid,
	"due_date" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "tasks" CASCADE;--> statement-breakpoint
ALTER TABLE "opus_labels" ADD CONSTRAINT "opus_labels_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_priorities" ADD CONSTRAINT "opus_priorities_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_statuses" ADD CONSTRAINT "opus_statuses_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_task_assignees" ADD CONSTRAINT "opus_task_assignees_task_id_opus_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."opus_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_task_assignees" ADD CONSTRAINT "opus_task_assignees_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_task_labels" ADD CONSTRAINT "opus_task_labels_task_id_opus_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."opus_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_task_labels" ADD CONSTRAINT "opus_task_labels_label_id_opus_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."opus_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_task_links" ADD CONSTRAINT "opus_task_links_task_id_opus_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."opus_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_tasks" ADD CONSTRAINT "opus_tasks_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_tasks" ADD CONSTRAINT "opus_tasks_parent_task_id_opus_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."opus_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_tasks" ADD CONSTRAINT "opus_tasks_status_id_opus_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."opus_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_tasks" ADD CONSTRAINT "opus_tasks_priority_id_opus_priorities_id_fk" FOREIGN KEY ("priority_id") REFERENCES "public"."opus_priorities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opus_tasks" ADD CONSTRAINT "opus_tasks_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."status";