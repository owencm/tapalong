Getting started
=========

Follow [these instructions](http://blog.joefallon.net/2013/10/install-mysql-on-mac-osx-using-homebrew/) to use Brew to install mysql. Create the database with the settings found in models.js. Run the server with `mysql.server start`

Watch for changes with `grunt watch`

To deploy:
- clear build directory
- Build for production, ensuring uglify etc is enabled
- scp build to the server using `scp -r build/* root@107.170.237.116:/var/www`
- scp package.json to the server using `scp package.json root@107.170.237.116:/var/www`
- SSH into the server `ssh root@104.236.153.209`
- Kill node on the server using `killall nodejs` and `killall node`
- Update node packaged with npm install
- Migrate the database.... somehow!
- Restart using `nohup forever NODE_ENV=production server.js &`
- `cat nohup.out` to ensure everything looks OK, and then browse to the server
