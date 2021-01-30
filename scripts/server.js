"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mysql = require("mysql");
class MessageToClient {
    constructor(_function, message, messageType) {
        this.Function = _function;
        this.Message = message;
        this.MessageType = messageType; //Error or Info
    }
}
/*
create der connection der Dbank
 */
let __dirname;
const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'usersManagementDB'
});
var currentMessageToClient = null;
const myWebServer = express();
myWebServer.listen(8484);
myWebServer.use(express.urlencoded({ extended: false }));
myWebServer.use(express.json());
myWebServer.use("/scripts", express.static(__dirname + "/scripts"));
myWebServer.use("/html", express.static(__dirname + "/html"));
myWebServer.use("/css", express.static(__dirname + "/css"));
myWebServer.use("/libs", express.static(__dirname + "/libs"));
// Die Startseite wird hier als Text im HTML-Format zurück gesendet
myWebServer.get("/", (req, res) => {
    connectDatabaseIfNotConnected();
    res.status(200);
    res.sendFile(__dirname + "/html/index.html");
});
myWebServer.get("/users/add", (req, res) => {
    console.log("something about to happen");
    try {
        // req.parameters = req.query;
        const query = req.query;
        connectDatabaseIfNotConnected();
        dbConnection.query('select count(*) from User where Nachname = \'' + query.name + "' and Vorname ='" + query.vorname + "' and Email ='" + query.email + "' and Rolle = '" + query.rolle + "' and Gueltig = 1", (err, rows) => {
            if (err)
                throw err;
            var sameEltsNbre = rows[0]['count(*)'];
            if (sameEltsNbre == 0) {
                dbConnection.query('insert into User (Nachname,Vorname,Email,Rolle,Passwort,Gueltig) values ( \'' + query.name + "' , '" + query.vorname + "' , '" + query.email + "' , '" + query.rolle + "' , '" + query.password + "' , 1)", (err, rows) => {
                    if (err)
                        throw err;
                    console.log("Benutzer erfolgreich angelegt\n");
                });
            }
            else {
                console.log("Benutzer existiert schon in der Datenbank");
                currentMessageToClient = new MessageToClient("Add", "Anlegen nicht erfolgreich.\n" + query.name + " , " + query.vorname + " mit der Email " + query.email + " ist schon vorhanden.", "Info");
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
myWebServer.get("/messages", (req, res) => {
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
myWebServer.get("/users", (req, res) => {
    try {
        connectDatabaseIfNotConnected();
        dbConnection.query('select Id, Nachname, Vorname,Email, Rolle from User where Gueltig = 1', (err, rows) => {
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
myWebServer.post("/users/delete", (req, res) => {
    try {
        const reqBody = req.body;
        connectDatabaseIfNotConnected();
        dbConnection.query('delete from User where Id  = ' + reqBody.Id + ' ;', (err, rows) => {
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
myWebServer.post("/users/update", (req, res) => {
    try {
        const query = req.body;
        connectDatabaseIfNotConnected();
        dbConnection.query('update User set Nachname = \'' + query.Nachname + '\', Vorname = \'' + query.Vorname + '\', Email = \'' + query.Email + '\', Rolle = \'' + query.Rolle + '\' where Id = ' + query.Id + ' ;', (err, rows) => {
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
myWebServer.post("/users/filter", (req, res) => {
    try {
        const query = req.body;
        connectDatabaseIfNotConnected();
        var queryStr = 'SELECT * FROM User where (Nachname like \'%' + query.NachnameFilter + '%\' and  Vorname like \'%' + query.VornameFilter + '%\')' + (query.RolleFilter != '-1' ? ('and Rolle = ' + query.RolleFilter) : ' ') + ' and Gueltig = 1 order by ' + query.OrderByFilter + ' ' + query.OrderType + ';';
        console.log("Qery = " + queryStr);
        dbConnection.query(queryStr, (err, rows) => {
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
myWebServer.use((req, res) => {
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
//# sourceMappingURL=server.js.map