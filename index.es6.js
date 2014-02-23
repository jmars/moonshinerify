/*
    Copyright (C) 2014  Jaye Marshall

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

var exec           = require('child_process').exec,
		co             = require('co'),
		temp           = require('temp'),
		thunkify       = require('thunkify'),
		fs             = require('fs'),
		path           = require('path'),
		transformTools = require('browserify-transform-tools'),
		traverse       = require('traverse');
		Parser         = require('moonshine/distillery/distillery.moonshine.js').Parser;

var readFile = thunkify(fs.readFile),
		openTemp = thunkify(temp.open),
		exec     = thunkify(exec),
		close    = thunkify(fs.close);

temp.track();

module.exports = transformTools.makeStringTransform('moonshinerify', {},
	function (content, transformOptions, done) {
		if (path.extname(transformOptions.file) !== '.lua') {
			return done(null, content)
		}
		co(function *(){
			var tempfile, outtemp, bytecode, json;

			tempfile = yield openTemp('moonshinerify');
			fs.write(tempfile.fd, content);
			yield close(tempfile.fd);
			outtemp = yield openTemp('moonshinerify');
			yield exec('luac -o ' + outtemp.path + ' ' + tempfile.path);
			bytecode = (yield readFile(outtemp.path, 'binary')).toString();
			temp.cleanup();
			json = new Parser().parse(bytecode);
			done(null, 'module.exports = ' + JSON.stringify(json));
		})()
	}
)
