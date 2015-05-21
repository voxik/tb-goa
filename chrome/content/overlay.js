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

    // Enumerate accounts.
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

    // Enumerate properties of each account.
    var calendar_accounts = {};
    for(var i = 0; i < accounts.length; i++) {
        var account_xml = '';
        subprocess.call({
            command: '/usr/bin/dbus-send',
            arguments: [
                "--dest=org.gnome.OnlineAccounts", "--print-reply=literal",
                "/org/gnome/OnlineAccounts/Accounts/" + accounts[i], "org.freedesktop.DBus.Introspectable.Introspect"
            ],
            done: function(result) {
                account_xml = result.stdout;
            },
            mergeStderr: false
        }).wait();

        var account_dom = parser.parseFromString(account_xml, "text/xml");
        var interface_nodes = account_dom.getElementsByTagName("interface");

        for(var n = 0; n < interface_nodes.length; n++) {
            var name = interface_nodes[n].getAttribute("name");
            if (name == "org.gnome.OnlineAccounts.Calendar") {
                calendar_accounts[accounts[i]] = account_dom;
                break;
            }
        }
    }

    for(var ca in calendar_accounts) {
       var access_token_string = '';
       subprocess.call({
           command: '/usr/bin/dbus-send',
           arguments: [
               "--dest=org.gnome.OnlineAccounts", "--print-reply",
               "/org/gnome/OnlineAccounts/Accounts/" + ca, "org.gnome.OnlineAccounts.OAuth2Based.GetAccessToken"
           ],
           done: function(result) {
               access_token_string = result.stdout;
           },
           mergeStderr: false,
       }).wait();

       var access_token_lines = access_token_string.split('\n');
       var access_token = access_token_lines[1].trim().split('"')[1];
       var access_token_expires_in = access_token_lines[2].trim().split(' ')[1];
       content_node.appendChild(
           document.createTextNode(access_token + '\n')
       );
       content_node.appendChild(
           document.createTextNode(access_token_expires_in + '\n')
       );
    }
}
