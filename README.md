Getting started
=========

Follow [these instructions](http://blog.joefallon.net/2013/10/install-mysql-on-mac-osx-using-homebrew/) to use Brew to install mysql. Create the database with the settings found in models.js. Run the server with `mysql.server start`

Watch for changes with `grunt watch`

To deploy:

- scp to the server using `scp -r server/* root@xxx.xxx.xxx.xxx:/var/www`
- scp package.json to the server using `scp package.json root@xxx.xxx.xxx.xxx:/var/www`
- SSH into the server `ssh root@xxx.xxx.xxx.xxx`
- Kill node on the server using `killall nodejs` and `killall node`
- Update node packaged with npm install
- Migrate the database with `NODE_ENV=production sequelize db:migrate`
- Source the keys with `source keys`
- Restart using `NODE_ENV=production nohup forever server.js &`
- `cat nohup.out` to ensure everything looks OK, and then browse to the server

TODO: write a script to do this for me.
TODO: deploy on a second machine, disable database writes on first machine, copy DB to second machine, check second machine looks good, then swap IP to second machine.
