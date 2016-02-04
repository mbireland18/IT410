var fs = require('fs');
var Path = require('path');
//var Promise = require('bluebird');
/*
Promise : getPathType ( path : String )

Determine if the path points to a file, a directory, nothing, or other. This is done using fs.stat.

    Parameters:

path ( String ) - The file path to get the file type for.
Returns

( Promise )
Resolves to one of the following: "file", "directory", "nothing", "other".
    This promise will be rejected if
    The provided path is not a string.
*/

//exports.getPathType = function(path) {
exports.getPathType = function(path) {
    if (typeof path !== "string"){
        return Promise.reject('not a string');
    }
    return new Promise(function(resolve, reject) {

        fs.stat(path,function(err, stats) {
            if (err) {
               resolve('nothing');
            }
            else if (stats.isFile()) {
                resolve('file');
            }
            else if (stats.isDirectory()) {
                resolve('directory');
            }
            else {
                resolve('other');
            }
        });
    });
};

//getPathType(process.cwd());
//console.log(process.cwd());

/*Promise : getDirectoryTypes ( path : String [, depth : Number = -1 ]
[, filter : Function = function(path, type) { return true; } )

Read a directory and get the path types, using fs.readdir and getPathType, for each file path in the directory.

    Parameters:
path ( String ) - The path of the directory to get file paths and file types for.
depth ( Number ) [ optional ] [ Default: -1 ] - How deep to recurse the directory.
If a negative number is provided then recurse infinitely. If zero then don't recurse.
filter ( Function ) [ optional ] [ Default: function(path, type) { return true; } )
- A function that is called for each file found. This function is sent the path and the path type.
If the function returns true then the file path and file type are added to the result set.
    Returns:

( Promise )
Resolves to an object map that maps file paths to file path types. Example map result:
{
    'path/to/file': 'file',
    'path/to/directory: 'directory'
}
This promise is rejected if:
The path is not a string
The depth is not a number
The filter is not a function
The path does not point to a directory that can be read
Any other error occurs
*/

exports.readDir = function(path){
    return exports.getPathType(path)
        .then(function(resolution){
            if (resolution !== 'directory') throw Error('Not a directory');
            return new Promise(function(resolve, reject){
                //fs.readdir returns a directory of everything inside it ("files")
                fs.readdir(path, function(err, files){
                    if (err) return reject(err);
                    return resolve(files);
                });
            });
        });
}

exports.getDirectoryTypes = function(path,depth,filter) {
    var result = {};
    if (typeof depth !== 'number') return Promise.reject('not an int');
    if (arguments.length < 2) depth = -1;
    if (arguments.length < 3) filter = function(path,type) {return true;}

    return exports.readDir(path)
        .then(function(files) {
            var promises = [];
            files.forEach(function(file) {
                var fullPath = Path.resolve(path, file);
                var promise = exports.getPathType(fullPath)
                    .then(function(type) {
                        if (filter(fullPath,type)===true) result[fullPath] = type;
                        if (type === 'directory' && depth !== 0) {
                            return exports.getDirectoryTypes(fullPath,depth - 1,filter)
                                .then(function(map) {
                                    Object.assign(result,map);
                                });
                        }
                    });
                promises.push(promise);
            });
            return Promise.all(promises)
                .then(function() {
                    return result;
                });
        });
}



/*Promise : exists ( path : String )

Check to see if something exists at the specified path by using getPathType.

    Parameters:

path ( String ) - The file path to check for the existence of something at.
Returns

( Promise )
Resolves to true if the file exists or false if not.
    Rejects if the path is not a string.
*/

exports.exists = function(path) {
    return exports.getPathType(path)
        .then(function(resolution) {
            return resolution != "nothing";
        });
}

/*Promise : getFilePaths ( path: String [, depth : Number = -1 ] )

Read a directory (and possibly sub-directories) to get an array of all paths to files, using getDirectoryTypes.

    Parameters:

path ( String ) - The file path of the directory.
Returns

( Promise )
Resolves to an array of file paths for all files found.
    Rejects if:
The path is not a string.
    The path does not point to a file.
    The depth is not a number.
    Any other error occurs.
*/

exports.getFilePaths = function(path,depth) {

    return exports.getDirectoryTypes(path,depth, function(path,type) {
        return type === 'file';
    }).then(function(resolution){
        return Object.keys(resolution);
    });
}

/*Promise : readFile ( path: String )

Get the contents of a file.

    Parameters:

path ( String ) - The file path.
Returns

( Promise )
Resolves to a string containing the file's contents.
Rejects if
    The path is not a string.
    The path does not point to a file.
    The file cannot be read.
*/

exports.readFile = function(path) {
    if (typeof path !== "string"){
        return Promise.reject('not a string');
    }
    return new Promise(function(resolve,reject) {
        fs.readFile(path,'utf8',function(err, data) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(data);
            }
        });
    });
}

/*Promise : readFiles ( paths: String[] )

Get the contents of multiple files using readFile.

    Parameters:

paths ( String[] ) - An array of strings where each string is a file path.
Returns

( Promise )
Resolves to an object map of file names to file contents.
    Rejects if one or more files cannot be read.
*/

exports.readFiles = function(paths) {
    if (!Array.isArray(paths)) return Promise.reject('not an array');
    var promises = [];
    paths.forEach(function(path) {
        promises.push(exports.readFile(path));
    });
    return Promise.all(promises).then(function(resolution) {
        var map = {};
        paths.forEach(function(path,index) {
            map[path] = resolution[index];
        })
        return map;
    });
}