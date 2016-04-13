var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure,
    server = new Server('localhost', 27017, {auto_reconnect: true}),
    db = new Db('410users', server, {safe:true}),
    users = 'user';

db.open(function(error,db){
    if(!error){
        console.log("Connected to database 410users");
        db.collection(users, {strict:true, safe:true}, function(errorCollection, collection){
            if(errorCollection){
                console.log("The collection "+users+" does not exist");
                createCollection();
            }
        });
    }else{
        console.log("There is no 410users database.");
        console.log(error);
    }
});

var createCollection = function() {
    db.createCollection("user", function(error, collection){});
};

/*Authenticate user with password*/
exports.authenticate = function(username, password){
    return new Promise(function(resolve, reject){
        db.collection(users, function(error, collection){
            collection.findOne({'username':username, 'password':password},function(error,result){
                if(result){
                    return resolve("Authentication was successful.");
                }
                else {
                    return resolve("Authentication was unsuccessful.")
                }
            })
        })
    })

};

/*Update user password*/
exports.updatePassword = function(username, password){
    return new Promise(function(resolve, reject){
        db.collection(users, function(error, collection){
            var user = collection.findOne({'username':username},function(error,result){
                if (!error){
                    collection.update({'username':username}, {'password':password}, {safe:true},function(error,resultUpdate){
                        if(error) return resolve("Password did not update.");
                        return resolve('Password updated.');
                    });
                }else return resolve("User was not found: "+error);
            });
        });
    });
};


/*Create user*/
exports.createUser = function(email,username,password){
    return new Promise(function(resolve, reject){
        db.collection(users, function(err,collection){
            collection.findOne({'username':username, 'password':password},function(err,result){
                if(result){
                    return resolve("Username already exists.")
                } else{
                    collection.insert({
                        email: email,
                        username:username,
                        password: password,
                        created: Date.now()
                    }, {safe:true}, function(err, result){
                        if(result){
                            return resolve('New user '+username+' added');
                        }
                    });
                }
            });
        })
    })
};