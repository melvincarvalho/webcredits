var WebSocket = require('ws');
var exec      = require('child_process').exec;
var $rdf      = require('rdflib');
var https     = require('https');
var sha256    = require('sha256');

var port   = 443;
var ldpc   = process.argv[2] || 'https://klaranet.com/d/user/';
var domain = ldpc.split('/')[2];
var wss    = 'wss://'+domain+':'+port+'/';
var sub    = ldpc + ',meta';
var subs   = [];

console.log('running webcredits daemon on ' + domain);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

subs.push(sub);
var ws    = new WebSocket(wss, null, {rejectUnauthorized: false});

var options = {
  host: domain,
  port: port,
  method: 'DELETE'
};



// Globals
var __kb;
var __profile;
var PROXY = "https://rww.io/proxy.php?uri={uri}";
var AUTH_PROXY = "https://rww.io/auth-proxy?uri=";
var TIMEOUT = 90000;
var DEBUG = true;
// Namespaces
var RDF   = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var RDFS  = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
var FOAF  = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
var OWL   = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
var SPACE = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
var UI    = $rdf.Namespace("http://www.w3.org/ns/ui#");
var DCT   = $rdf.Namespace("http://purl.org/dc/terms/");
var CERT  = $rdf.Namespace("http://www.w3.org/ns/auth/cert#");
var CURR  = $rdf.Namespace("https://w3id.org/cc#");
var ACL   = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");
var LDP   = $rdf.Namespace("http://www.w3.org/ns/ldp#");

$rdf.Fetcher.crossSiteProxyTemplate=PROXY;
var g = $rdf.graph();
var f = $rdf.fetcher(g, TIMEOUT);


console.log(ws);

ws.on('open', function() {

  console.log('fetching user dirs from ' + ldpc);
  f.requestURI(ldpc,undefined,true, function(ok, body, xhr) {
    console.log('container fetched');


    var x = g.statementsMatching($rdf.sym(ldpc), LDP("contains"));


    for (var i=0; i<x.length; i++) {
      var sub = 'sub ' + x[i].object.uri + ',meta';
      console.log(sub);
      ws.send( sub );
    }
  });
});




ws.on('message', function(message) {
  console.log('received: %s', message);




  ldpc = message.split(' ')[1].split(',')[0];


  var g = $rdf.graph();
  var f = $rdf.fetcher(g, TIMEOUT);


  f.requestURI(ldpc,undefined,true, function(ok, body, xhr) {
    console.log('tx fetched');

    var x = g.statementsMatching($rdf.sym(ldpc), LDP("contains"));
    for (var i=0; i<x.length; i++) {
      var tx = x[i].object.uri;
      if (! (/.*[0-9]+$/).test(tx) ) continue;
      console.log(tx);

      f.requestURI(tx,undefined,true, function(ok, body, xhr) {
        var source      = g.any($rdf.sym(tx), CURR('source'));
        var destination = g.any($rdf.sym(tx), CURR('destination'));
        var amount      = g.any($rdf.sym(tx), CURR('amount'));
        var currency    = g.any($rdf.sym(tx), CURR('currency'));
        var comment     = g.any($rdf.sym(tx), RDFS('comment'));

        if (comment) {
          comment = comment.value;
        } else {
          comment = 'vw';
        }


        if (!source || !destination || !amount || !currency) return;

        var t = [source.value, amount.value, currency.value, destination.value, comment];
        console.log(t);


        // withdraw
        if (t[3].indexOf('bitmark:') === 0 || t[3].indexOf('bitcoin:') === 0) {

          if (t[3].indexOf('bitmark:') === 0) {
            command = 'bitmark-cli sendtoaddress ' + t[3].split(":")[1] + ' ' + ( parseFloat(t[1]) / 1000.0 );
          }

          if (t[3].indexOf('bitcoin:') === 0) {
            command = 'bitcoin-cli sendtoaddress ' + t[3].split(":")[1] + ' ' + ( parseFloat(t[1]) / 1000.0 );
          }


          console.log(command);
          exec(command, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
              console.log('exec error: ' + error);
            }

            callback = function(response) {

              console.log(JSON.stringify(response.headers));

              var str = '';
              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function () {
                console.log(str);
              });
            };

            options.path = '/' + tx.split('/').splice(3).join('/');
            console.log(options.path);
            var req = https.request(options, callback);
            //This is the data we are posting, it needs to be a string or a buffer
            req.write('');
            req.end();

            setTimeout(function(){
              options.method = 'PUT';
              options.path = '/' + tx.split('/').splice(3, tx.split('/').splice(3).length-2 ).join('/') + '/' + sha256(t[0]) + '/,meta';
              console.log(options);
              var req = https.request(options, callback);
              req.write('<> <http://www.w3.org/ns/posix/stat#mtime> "'+ Math.floor(Date.now() / 1000) +'" . ');
              req.end();

              options.method = 'PUT';
              options.path = '/' + tx.split('/').splice(3, tx.split('/').splice(3).length-2 ).join('/') + '/' + sha256(t[3]) + '/,meta';
              console.log(options);
              req = https.request(options, callback);
              req.write('<> <http://www.w3.org/ns/posix/stat#mtime> "'+ Math.floor(Date.now() / 1000) +'" . ');
              req.end();
            });

          });


        } else {

          var command = "nodejs insert.js '"+t[0]+"' "+t[1]+" '"+t[2]+"' '"+t[3]+"' '"+t[4]+"'";
          console.log(command);
          exec(command, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
              console.log('exec error: ' + error);
            }

            callback = function(response) {

              console.log(JSON.stringify(response.headers));

              var str = '';
              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function () {
                console.log(str);
              });
            };

            options.path = '/' + tx.split('/').splice(3).join('/');
            console.log(options.path);
            var req = https.request(options, function(response) {

              console.log(JSON.stringify(response.headers));

              var str = '';
              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function () {
                console.log(str);
                console.log('file deleted');
                setTimeout(function(){
                  options.method = 'PUT';
                  options.path = '/' + tx.split('/').splice(3, tx.split('/').splice(3).length-2 ).join('/') + '/' + sha256(t[0]) + '/,meta';
                  console.log(options);
                  var req = https.request(options, callback);
                  req.write('<> <http://www.w3.org/ns/posix/stat#mtime> "'+ Math.floor(Date.now() / 1000) +'" . ');
                  req.end();

                  options.method = 'PUT';
                  options.path = '/' + tx.split('/').splice(3, tx.split('/').splice(3).length-2 ).join('/') + '/' + sha256(t[3]) + '/,meta';
                  console.log(options);
                  req = https.request(options, callback);
                  req.write('<> <http://www.w3.org/ns/posix/stat#mtime> "'+ Math.floor(Date.now() / 1000) +'" . ');
                  req.end();



                  exec('./hook.sh', function(){});



                }, 500);
              });


            });
            //This is the data we are posting, it needs to be a string or a buffer
            req.write('');
            req.end();


          });



        }


      });

    }


  });













});
