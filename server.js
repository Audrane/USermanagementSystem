"use strict";
exports.__esModule = true;
var express = require("express");
var mysql = require("mysql");
var MessageToClient = /** @class */ (function () {
    function MessageToClient(_function, message, messageType) {
        this.Function = _function;
        this.Message = message;
        this.MessageType = messageType; //Error or Info
    }
    return MessageToClient;
}());
/*
create der connection der Dbank
 */
var b;
var c;
var __dirname;
var dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'usersManagementDB'
});
var currentMessageToClient = null;
var myWebServer = express();
myWebServer.listen(8080);
myWebServer.use(express.urlencoded({ extended: false }));
myWebServer.use(express.json());
myWebServer.use("/scripts", express.static(__dirname + "/scripts"));
myWebServer.use("/html", express.static(__dirname + "/html"));
myWebServer.use("/css", express.static(__dirname + "/css"));
myWebServer.use("/libs", express.static(__dirname + "/libs"));
// Die Startseite wird hier als Text im HTML-Format zurück gesendet
myWebServer.get("/", function (req, res) {
    connectDatabaseIfNotConnected();
    res.status(200);
    res.sendFile(__dirname + "/html/index.html");
});
myWebServer.get("/users/add", function (req, res) {
    console.log("something about to happen");
    try {
        // req.parameters = req.query;
        var query_1 = req.query;
        connectDatabaseIfNotConnected();
        dbConnection.query('select count(*) from User where Nachname = \'' + query_1.name + "' and Vorname ='" + query_1.vorname + "' and Email ='" + query_1.email + "' and Rolle = '" + query_1.rolle + "' and Gueltig = 1", function (err, rows) {
            if (err)
                throw err;
            var sameEltsNbre = rows[0]['count(*)'];
            if (sameEltsNbre == 0) {
                dbConnection.query('insert into User (Nachname,Vorname,Email,Rolle,Passwort,Gueltig) values ( \'' + query_1.name + "' , '" + query_1.vorname + "' , '" + query_1.email + "' , '" + query_1.rolle + "' , '" + query_1.password + "' , 1)", function (err, rows) {
                    if (err)
                        throw err;
                    console.log("Benutzer erfolgreich angelegt\n");
                });
            }
            else {
                console.log("Benutzer existiert schon in der Datenbank");
                currentMessageToClient = new MessageToClient("Add", "Anlegen nicht erfolgreich.\n" + query_1.name + " , " + query_1.vorname + " mit der Email " + query_1.email + " ist schon vorhanden.", "Info");
            }
        });
        res.status(200);
        res.redirect("/");
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole");
    }
});
myWebServer.get("/messages", function (req, res) {
    try {
        res.json(currentMessageToClient);
        currentMessageToClient = null;
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Konsole");
    }
});
myWebServer.get("/users", function (req, res) {
    try {
        connectDatabaseIfNotConnected();
        dbConnection.query('select Id, Nachname, Vorname,Email, Rolle from User where Gueltig = 1', function (err, rows) {
            if (err)
                throw err;
            res.json(rows);
        });
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Konsole");
    }
});
//konnte Aauch delete benutzen
myWebServer.post("/users/delete", function (req, res) {
    try {
        var reqBody = req.body;
        connectDatabaseIfNotConnected();
        dbConnection.query('delete from User where Id  = ' + reqBody.Id + ' ;', function (err, rows) {
            if (err)
                throw err;
            console.log("Benutzersssss erfolgreich gelöscht");
        });
        /*
                dbConnection.query('update User set Gueltig=0 where Id = '+reqBody.Id+' ;', (err, rows) => {
                    if (err) throw err;
                    console.log("Benutzer erfolgreich gelöscht");
                });
        */
        res.status(200);
        res.cookie("session", "testSession1");
        res.redirect("/");
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole");
    }
});
//event put
myWebServer.post("/users/update", function (req, res) {
    try {
        var query = req.body;
        connectDatabaseIfNotConnected();
        dbConnection.query('update User set Nachname = \'' + query.Nachname + '\', Vorname = \'' + query.Vorname + '\', Email = \'' + query.Email + '\', Rolle = \'' + query.Rolle + '\' where Id = ' + query.Id + ' ;', function (err, rows) {
            if (err)
                throw err;
            console.log("Datensatz aktualisiert");
        });
        res.status(200);
        res.redirect("/");
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole");
    }
});
myWebServer.post("/users/filter", function (req, res) {
    try {
        var query = req.body;
        connectDatabaseIfNotConnected();
        var queryStr = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';
        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, function (err, rows) {
            if (err)
                throw err;
            res.status(200);
            res.json(rows);
        });
    }
    catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole");
    }
});
// Wenn keine andere Regel passt, gibt sie den 404-Fehler zurück.
myWebServer.use(function (req, res) {
    res.status(404);
    res.send('<br><h1>Die gewünschte Seite wurde vom Webserver nicht gefunden!</h1>');
});
function connectDatabaseIfNotConnected() {
    if (dbConnection.state != "authenticated")
        dbConnection.connect(function (err) {
            if (err)
                throw err;
            console.log("Verbindung zu Datenbank hergestellt.");
        });
}
/**
 myWebServer.post("/users/filter", (req: express.Request, res: express.Response) => {

    try {

        const query = req.body;


        connectDatabaseIfNotConnected();
        var queryStr: string = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';

        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
            if (err) throw err;
            res.status(200);
            res.json(rows);
        });


    } catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole")
    }

});
 myWebServer.post("/users/filter", (req: express.Request, res: express.Response) => {

    try {

        const query = req.body;


        connectDatabaseIfNotConnected();
        var queryStr: string = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';

        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
            if (err) throw err;
            res.status(200);
            res.json(rows);
        });


    } catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole")
    }

});
 myWebServer.post("/users/filter", (req: express.Request, res: express.Response) => {

    try {

        const query = req.body;


        connectDatabaseIfNotConnected();
        var queryStr: string = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';

        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
            if (err) throw err;
            res.status(200);
            res.json(rows);
        });


    } catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole")
    }

});
 myWebServer.post("/users/filter", (req: express.Request, res: express.Response) => {

    try {

        const query = req.body;


        connectDatabaseIfNotConnected();
        var queryStr: string = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';

        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
            if (err) throw err;
            res.status(200);
            res.json(rows);
        });


    } catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole")
    }

});
 myWebServer.post("/users/filter", (req: express.Request, res: express.Response) => {

    try {

        const query = req.body;


        connectDatabaseIfNotConnected();
        var queryStr: string = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';

        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
            if (err) throw err;
            res.status(200);
            res.json(rows);
        });


    } catch (e) {
        console.log(e);
        res.status(404);
        res.send("Etwas ist schiefgelaufen in dem Server.\nSiehe bitte Log-Infos in Server-Konsole")
    }

});
 */ 
