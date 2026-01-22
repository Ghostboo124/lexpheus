CREATE TABLE "api_keys" (
	"api_key" varchar PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"projects" json[] NOT NULL,
	"disabled" boolean,
	CONSTRAINT "api_keys_channel_unique" UNIQUE("channel")
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"project_id" integer PRIMARY KEY NOT NULL,
	"ids" json[] DEFAULT '{}' NOT NULL,
	"ship_status" text
);
