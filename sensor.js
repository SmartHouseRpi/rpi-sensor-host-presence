'use strict';

const Redis = require('redis')
const ping = require('ping');

var host = undefined;
var db_key = undefined;
var offline_threshold_sec = 15;

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

if(typeof process.env.offline_threshold_sec !== 'undefined') {
  offline_threshold_sec = process.env.offline_threshold_sec;
}


console.log(`Monitoring online presence of host ${host}, storing state in Redis key ${db_key}.`);
console.log("Host is considered offline after not responding to pings for "+offline_threshold_sec+" seconds. You can tune this threshold value with 'offline_threshold_sec' environmental variable");

var state="unknown";
var lastOnline = new Date(2000, 1, 1); //initial time moment is long in the past

var link = Redis.createClient(6379, "redis");

function Update(new_state) {
  console.log("Updating database (key "+db_key+")...");
  link.set(db_key,new_state,function(error) {
    if(!error) {
      console.log("Database updated");
      var publishing_key = `${db_key}.subscription`;
      console.log("Sending notifications ("+publishing_key+")");
      link.publish(publishing_key, new_state, function(error) {
      if(!error) {
         console.log("sent");
         state=new_state;  
      }
      else
         console.warn("error sending notifications: "+error);
      });
    }
    else
      console.warn("error updating database: "+error);
    });
}

function Tick() {
	ping.sys.probe(host, function(isAlive){
	var now = new Date();
	var curState = isAlive?"online":"offline";
	if(isAlive)
		lastOnline = now;
	if(state != curState) {
		if(isAlive) {
			console.log("Host came online");
		} else {
			if(now - lastOnline > offline_threshold_sec*1000.0) {
				console.log("Host went offline");
			}
			else {
				console.log("Host does not respond.");
				return;
			}
		}		
		Update(curState);
	}
    });
}

Tick();
setInterval(Tick, 10000);
