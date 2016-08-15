'use strict';

const Redis = require('node-redis')

var host = undefined;
var db_key = undefined;
var offline_threshold_sec = 35;

if(typeof process.env.host !== 'undefined') {
  host = process.env.host;
} else {
  throw "'host' environmental variable is not set. Set it and restart container";
}

if(typeof process.env.db_key !== 'undefined') {
  db_key = process.env.db_key;
} else {
  throw "'db_key' environmental variable is not set. Set it and restart container";
}

if(typeof process.env.db_key !== 'undefined') {
  offline_threshold_sec = process.env.offline_threshold_sec;
}

var ping = require('ping');

console.log(`Monitoring online presence of host ${host}, storing state in Redis key ${db_key}.`);
console.log(`Host is considered offline after not responding to pings for ${offline_threshold_sec} seconds. You can tune this threshold value with 'offline_threshold_sec' environmental variable`)

var state="unknown";
var lastOnline = new Date(2000, 1, 1); //initial time moment is long in the past

function Tick() {
	ping.sys.probe(host, function(isAlive){
	var now = Date();
	var curState = isAlive?"online":"offline";
	if(isAlive)
		lastOnline = now;
	if(state != curState) {
		if(isAlive) {
			console.log("Host came online");
		} else {
			if((now - lastOnline)/1000>-offline_threshold_sec) {
				cosnole.log("Host came offline");
			}
			else {
				console.log("Host does not respond.");
				return;
			}
		}		
		state=curState;
	}
    });
}

Tick();
setInterval(Tick, 10000);
