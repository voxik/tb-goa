// This is going to be part of add-on SDK, but the original (with modifications
// to properly decode stdout) is used as of now.
// https://github.com/mozilla/addon-sdk/tree/master/lib/sdk/system/child_process
Components.utils.import("resource://tb-goa/subprocess.js");

window.addEventListener("load", function(e) { 
    startup();
}, false);

window.setInterval(
    function() {
        startup();
    }, 60000); //update date every minute

function startup() {

    var output = '';
    var p = subprocess.call({
        command: '/usr/bin/dbus-send',
        arguments: [
            "--dest=org.gnome.OnlineAccounts", "--type=method_call", "--print-reply",
            "/org/gnome/OnlineAccounts/Accounts/account_1431601757_1", "org.gnome.OnlineAccounts.OAuth2Based.GetAccessToken"
        ],
        done: function(result) {
            output = result.stdout;
        },
        mergeStderr: false
    });

    p.wait(); // wait for the subprocess to terminate,
            // this will block the main thread,
            // only do if you can wait that long

    var myPanel = document.getElementById("goa-content");
    myPanel.innerHTML = "Output: " + output;
}
