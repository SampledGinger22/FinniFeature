CREATE TABLE "address" (
	"id" uuid PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"line1" text,
	"line2" text,
	"city" text,
	"region" text NOT NULL,
	"postal_code" text,
	"country" text DEFAULT 'US' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_method" (
	"id" uuid PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"status" text NOT NULL,
	"has_insurance" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_method" ADD CONSTRAINT "contact_method_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_patient_id_idx" ON "address" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "address_region_idx" ON "address" USING btree ("region");--> statement-breakpoint
CREATE INDEX "address_city_idx" ON "address" USING btree ("city");--> statement-breakpoint
CREATE INDEX "contact_method_patient_id_idx" ON "contact_method" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_scope_idx" ON "patient" USING btree ("deleted_at","archived","status");--> statement-breakpoint
CREATE INDEX "patient_dob_idx" ON "patient" USING btree ("date_of_birth");