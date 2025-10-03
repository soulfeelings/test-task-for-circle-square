import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1735939200000 implements MigrationInterface {
  name = 'InitialMigration1735939200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('survivor', 'admin', 'nikita');
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "username" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'survivor',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "rounds" (
        "id" SERIAL NOT NULL,
        "title" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "total_points" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rounds_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "round_scores" (
        "id" SERIAL NOT NULL,
        "roundId" integer,
        "userId" integer,
        "taps" integer NOT NULL DEFAULT 0,
        "points" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_round_scores_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_round_scores_round_user" ON "round_scores" ("roundId", "userId");
    `);
    await queryRunner.query(`
      ALTER TABLE "round_scores"
        ADD CONSTRAINT "FK_round_scores_round" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "round_scores"
        ADD CONSTRAINT "FK_round_scores_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "round_scores" DROP CONSTRAINT "FK_round_scores_user";
    `);
    await queryRunner.query(`
      ALTER TABLE "round_scores" DROP CONSTRAINT "FK_round_scores_round";
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_round_scores_round_user";
    `);
    await queryRunner.query(`
      DROP TABLE "round_scores";
    `);
    await queryRunner.query(`
      DROP TABLE "rounds";
    `);
    await queryRunner.query(`
      DROP TABLE "users";
    `);
    await queryRunner.query(`
      DROP TYPE "public"."users_role_enum";
    `);
  }
}
