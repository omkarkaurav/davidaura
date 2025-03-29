CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"composition" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"fragrance" varchar(255) NOT NULL,
	"fragranceNotes" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"dprice" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"discount" integer NOT NULL,
	"oprice" integer NOT NULL,
	"size" integer NOT NULL,
	"imageurl" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(255) NOT NULL,
	"role" text DEFAULT 'user',
	"createdAt" varchar DEFAULT 'now()',
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
