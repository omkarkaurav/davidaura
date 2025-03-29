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
