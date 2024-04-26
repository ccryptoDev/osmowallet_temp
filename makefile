generate_env_dev:
		op inject -i env.dev.tpl -o .env.development

generate_env_stg:
		op inject -i env.stg.tpl -o .env.staging

generate_env_prod:
		op inject -i env.prod.tpl -o .env.production

.PHONY: generate_env_dev generate_env_stg generate_env_prod

new_migration:
		npm run typeorm -- -d ./src/config/typeorm.ts migration:generate ./src/migrations/$(migration_name)

.PHONY: new_migration

run_dev:
		npm start run:dev
