CREATE TABLE "addtocart" (
	"id" serial PRIMARY KEY NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addtocart" ADD CONSTRAINT "addtocart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addtocart" ADD CONSTRAINT "addtocart_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;