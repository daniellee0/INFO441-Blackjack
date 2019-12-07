$( "#register" ).submit(function( event ) {
    var jsonData = {};
    jsonData["Email"] = $("#email").val();
    jsonData["Username"] = $("#username").val();
    jsonData["FirstName"] = $("#firstname").val();
    jsonData["LastName"] = $("#lastname").val();
    jsonData["Password"] = $("#password").val();
    jsonData["PasswordConf"] = $("#passwordconf").val();

    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/users/signup";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            var json = JSON.parse(xhr.responseText);

            window.location = "https://raffisy.com";
        } else if (xhr.readyState ===4) {
            alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
    event.preventDefault();
});


// function requestSummary() {
//     let url = document.getElementById("reqURL").value;
//     if (url != "") {
//         xhttp.open("GET", url, true);
//         xhttp.send();
//     } else {
//         window.alert("URL length must be greater than 0.")
//     }
// }

