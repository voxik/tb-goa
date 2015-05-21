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
    var content_node = document.getElementById("goa-content");

    var accounts_xml = '';
    subprocess.call({
        command: '/usr/bin/dbus-send',
        arguments: [
            "--dest=org.gnome.OnlineAccounts", "--print-reply=literal",
            "/org/gnome/OnlineAccounts/Accounts", "org.freedesktop.DBus.Introspectable.Introspect"
        ],
        done: function(result) {
            accounts_xml = result.stdout;
        },
        mergeStderr: false
    }).wait();


    var parser = new DOMParser();
    var accounts_dom = parser.parseFromString(accounts_xml, "text/xml");
    var account_nodes = accounts_dom.documentElement.childNodes;

    var accounts = [];
    for(var i = 0; i < account_nodes.length; i++) {
        if (account_nodes[i].nodeType == 1) {
            accounts.push(account_nodes[i].attributes.getNamedItem("name").nodeValue);
        }
    }

    for(var i = 0; i < accounts.length; i++) {
        content_node.appendChild(
            document.createTextNode(accounts[i] + '\n')
        );
    }

    var output = '';
    subprocess.call({
        command: '/usr/bin/dbus-send',
        arguments: [
            "--dest=org.gnome.OnlineAccounts", "--print-reply",
            "/org/gnome/OnlineAccounts/Accounts/account_1431601757_1", "org.gnome.OnlineAccounts.OAuth2Based.GetAccessToken"
        ],
        done: function(result) {
            output = result.stdout;
        },
        mergeStderr: false
    }).wait();

    content_node.appendChild(
        document.createTextNode(output)
    );
}
