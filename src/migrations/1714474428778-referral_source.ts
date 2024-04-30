import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralSource1714474428778 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE referral_source (
                id uuid PRIMARY KEY,
                source_name character varying NOT NULL
            );
        `);

        await queryRunner.query(`
            INSERT INTO referral_source (id, source_name) VALUES
                ('1', 'Instagram'),
                ('2', 'Tik Tok'),
                ('3', 'Publicidad en redes');
                ('4', 'Trabajo');
                ('5', 'Amigos');
                ('6', 'Eventos de Osmo');
                ('7', 'Leí un artículo');
                ('8', 'Google');
                ('9', 'Google');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE referral_source;');
    }

}
