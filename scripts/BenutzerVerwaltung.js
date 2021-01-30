var AlleBenutzer;
setInterval(showServerMessage, 1000);
/**
 * CRUD->PUT,GET,POST,DELETE->INSERT,SELECT,UPDATE,DELETE
 * rEST PERMET D EXPLOITER LES METHODES HTTP ASSOCIE A UNE URL
 * zb get sur www.audrane.com/livres/1
 */
class Benutzer {
    constructor(nam, vorn, email, Rolle, password = "", id) {
        this.Nachname = nam;
        this.Vorname = vorn;
        this.Email = email;
        this.Id = id;
        this.Rolle = Rolle;
        this.Password = password;
    }
    ;
}
function benutzereinfuegen() {
    //signup ist die id  von der DIv wo benutzer daten eingegeben werden müssen
    // userview wo der Filtereinstellungen sind müssen gehidt werden
    document.getElementById("signup").style.visibility = 'visible';
    document.getElementById("signup").style.display = 'block';
    document.getElementById("usersview").style.visibility = 'hidden';
    document.getElementById("usersview").style.display = 'none';
}
function ApplyFilter() {
    var nachnameFilter = document.getElementById("nachnameFilter").value.trim();
    var vornameFilter = document.getElementById("vornameFilter").value.trim();
    var rolleFilter = document.getElementById("rolleFilter").selectedOptions[0].value;
    var orderByFilter = document.getElementById("orderByFilter").selectedOptions[0].value;
    var orderType = document.getElementById("orderType").selectedOptions[0].value;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/users/filter', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            AlleBenutzer = JSON.parse(xhr.response);
            fillUserTable();
        }
    };
    var data = JSON.stringify({ "NachnameFilter": nachnameFilter, "VornameFilter": vornameFilter, "RolleFilter": rolleFilter, "OrderByFilter": orderByFilter, "OrderType": orderType });
    xhr.send(data);
}
function uebersicht() {
    document.getElementById("signup").style.visibility = 'hidden';
    document.getElementById("signup").style.display = 'none';
    document.getElementById("usersview").style.visibility = 'visible';
    document.getElementById("usersview").style.display = 'block';
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                AlleBenutzer = JSON.parse(request.response);
                fillUserTable();
            }
        }
    };
    request.open("GET", "/users", true);
    request.send();
}
function updateUser(benutzerId) {
    var myRow = document.getElementById("row" + benutzerId);
    var name_cell = myRow.cells[0];
    name_cell.innerHTML = "<input type=\"text\" value = \"" + name_cell.innerText + "\" id= \"name" + benutzerId + "\">";
    var vorname_cell = myRow.cells[1];
    vorname_cell.innerHTML = "<input type=\"text\" value = \"" + vorname_cell.innerText + "\" id= \"vorname" + benutzerId + "\">";
    var email_cell = myRow.cells[2];
    email_cell.innerHTML = "<input type=\"text\" value = \"" + email_cell.innerText + "\" id= \"email" + benutzerId + "\">";
    var rolle_cell = myRow.cells[3];
    var rolle = rolle_cell.innerText;
    var rolle_innerHTML = "<select  id= \"rolle" + benutzerId + "\">";
    rolle_innerHTML += "<option value=\"0\" " + (rolle == 'Kunde' ? "selected" : "") + ">Kunde</option>";
    rolle_innerHTML += "<option value=\"1\" " + (rolle == 'Mitarneiter' ? "selected" : "") + ">Mitarneiter</option>";
    rolle_innerHTML += "<option value=\"2\" " + (rolle == 'Administrator' ? "selected" : "") + ">Administrator</option>";
    rolle_innerHTML += "</select>";
    rolle_cell.innerHTML = rolle_innerHTML;
    var updateBtn_cell = myRow.cells[5];
    updateBtn_cell.innerHTML = "<button type=\"button\" id='lise' onclick=\"saveUserChanges(" + benutzerId + ");\"> Speichern </button>";
}
function saveUserChanges(benutzerId) {
    let name_input = document.getElementById("name" + benutzerId);
    if (isBlank(name_input.value) || isEmpty(name_input.value)) {
        alert("Name darf nicht leer sein");
        return;
    }
    let name = name_input.value;
    let vorname_input = document.getElementById("vorname" + benutzerId);
    if (isBlank(vorname_input.value) || isEmpty(vorname_input.value)) {
        alert("Vorname darf nicht leer sein");
        return;
    }
    let vorname = vorname_input.value;
    let email_input = document.getElementById("email" + benutzerId);
    if (isBlank(email_input.value) || isEmpty(email_input.value)) {
        alert("Email darf nicht leer sein");
        return;
    }
    if (!ValidateEmail(email_input.value)) {
        alert("Email hat ein falsches Format");
        return;
    }
    let email = email_input.value;
    let rolle_input = document.getElementById("rolle" + benutzerId);
    let rolle = rolle_input.selectedOptions[0].value;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/users/update', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var myRow = document.getElementById("row" + benutzerId);
            myRow.cells[0].innerHTML = name;
            myRow.cells[0].innerText = name;
            myRow.cells[1].innerText = vorname;
            myRow.cells[1].innerHTML = vorname;
            myRow.cells[2].innerText = email;
            myRow.cells[2].innerHTML = email;
            myRow.cells[3].innerText = rolle == "0" ? "Kunde" : rolle == "1" ? "Mitarbeiter" : "Administrator";
            myRow.cells[3].innerHTML = rolle == "0" ? "Kunde" : rolle == "1" ? "Mitarbeiter" : "Administrator";
            var updateBtn_cell = myRow.cells[5];
            updateBtn_cell.innerHTML = "<button type=\"button\" id='lise' onclick=\"updateUser(" + benutzerId + ");\"> Ändern </button>";
        }
    };
    var data = JSON.stringify({ "Id": benutzerId, "Nachname": name, "Vorname": vorname, "Email": email, "Rolle": rolle });
    xhr.send(data);
}
function isEmpty(str) {
    return (!str || 0 === str.length);
}
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
function ValidateEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        /*
        ^--->
        * facultatif
        +  +++
        ngnindjeuaudrane2.-@yahoo2.fr
        
         */
        //  if(/^([a-z 0-9\.-]+)@([a-z0-9-]+).([a-z]{2-8})$/.test(email))
        return (true);
    return (false);
}
function deleteUser(benutzerId) {
    var xhr = new XMLHttpRequest();
    var url = "url";
    xhr.open("POST", '/users/delete', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var myRow = document.getElementById("row" + benutzerId);
            // @ts-ignore
            document.getElementById("userstableView").deleteRow(myRow.rowIndex);
        }
    };
    var data = JSON.stringify({ "Id": benutzerId });
    xhr.send(data);
}
;
function fillUserTable() {
    var tableHeaderRowCount = 1;
    var table = document.getElementById("userstableView");
    var rowCount = table.rows.length;
    for (var i = tableHeaderRowCount; i < rowCount; i++) {
        table.deleteRow(tableHeaderRowCount);
    }
    AlleBenutzer.forEach((benutzer) => {
        var row = table.insertRow(table.rows.length);
        row.id = "row" + benutzer.Id;
        var name_cell = row.insertCell(0);
        name_cell.innerText = benutzer.Nachname;
        var vorname_cell = row.insertCell(1);
        vorname_cell.innerText = benutzer.Vorname;
        var email_cell = row.insertCell(2);
        email_cell.innerText = benutzer.Email;
        var rolle_cell = row.insertCell(3);
        rolle_cell.innerText = (benutzer.Rolle == "0" ? "Kunde" : (benutzer.Rolle == "1" ? "Mitarbeiter" : "Administrator"));
        var id_cell = row.insertCell(4);
        id_cell.innerText = (benutzer.Id).toString();
        var updateBtnCell = row.insertCell(5);
        updateBtnCell.innerHTML = "<button type=\"button\" id='lise' onclick=\"updateUser(" + benutzer.Id + ");\"> Ändern </button>";
        var deleteBtnCell = row.insertCell(6);
        deleteBtnCell.innerHTML = "<button type=\"button\" id='es' onclick=\"deleteUser(" + benutzer.Id + ");\"> Löschen </button>";
    });
}
function showServerMessage() {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var message = JSON.parse(request.response);
                if (message != null)
                    alert(message.Message);
            }
        }
    };
    request.open("GET", "/messages", true);
    request.send();
}
;
//# sourceMappingURL=BenutzerVerwaltung.js.map