Getting started
=========

Install virtualenv and virtualenvwrapper. Activate your workspace and run `pip install -r requirements.txt` 

Use Brew to install mysql and create a database with the settings found in settings.py. Run the server with `mysql.server start`

Use Grunt to build the client with `grunt`, or watch for changes with `grunt watch`.

Run `./manage.py syncdb` and `./manage.py migrate` to set up the db and run migrations, then run `./manage.py runserver` to start the server.

To push a new version:
- Disable login skipping in facebook.js
- Set grunt to disable source maps and minify (TODO: Implement this step)
- Ensure you have production-ready static assets in /static/
- Commit your changes
- Run `eb deploy`

Changing the models 
=========

Modify the models, then run: `./manage.py schemamigration tapalong_app --auto`
You can now migrate the database with `./manage.py migrate tapalong_app`
