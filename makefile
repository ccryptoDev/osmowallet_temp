generate_env_dev:
		op inject -i env.dev.tpl -o .env.development

generate_env_stg:
		op inject -i env.stg.tpl -o .env.staging

generate_env_prod:
		op inject -i env.prod.tpl -o .env.production

run_dev:
		npm start run:dev