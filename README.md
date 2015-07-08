Instructions
=========

`git submodule update --init --recursive`

in Backend run `pip install -r requirements.txt`

Follow this (but don't actually create a new project) for getting the Django section running: http://www.jeffknupp.com/blog/2012/10/24/starting-a-django-14-project-the-right-way/

If you want to get started now, skip this step. If you feel like using mysql instead then install it here: http://dev.mysql.com/doc/refman/5.7/en/installing.html and update settings.py to connect to it. Think twice about commiting those changes though ;)

Push a new version to AWS using `./manage.py collectstatic` and then `eb deploy`
