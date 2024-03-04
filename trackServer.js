const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const port = 3000;
const ofgIDa = "2100156";
const ofgIDb = "10115610";
const cbdID = "10111010";

const usedIDs = [cbdID];

app.get("/", cors() ,(req, res) => {
  console.log("request from " + req.url);
  const results = usedIDs.map((usedID) => getBusData(usedID));
  Promise.all(results).then((results) => {
    res.send(results.flat());
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const key =
  "";

const numResults = 3;

// ping TransportNSW with a request to get busData
async function getBusData(usedID) {
  const date = getDate();
  const time = getTime();
  const requestURL = `https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=${usedID}&itdDate=${date}&itdTime=${time}&departureMonitorMacro=true&TfNSWDM=true&version=`;

  const busData = await fetch(requestURL, {
    method: "GET",
    accept: "application/json",
    mode: "no-cors",
    headers: {
      Authorization: `apikey ${key}`,
    },
  }).then((response) => response.json());

  console.log(busData);

  const trimmedBusData = busData.stopEvents
    .filter(
      (stopEvent, index) => stopEvent.isRealtimeControlled && index < numResults
    )
    .map((stopEvent) => {
      const {
        departureTimeBaseTimetable,
        departureTimePlanned,
        departureTimeEstimated,
        transportation,
      } = stopEvent;
      return {
        departureTimePlanned,
        departureTimeBaseTimetable,
        departureTimeEstimated,
        busName: transportation.disassembledName,
      };
    });

  return trimmedBusData;
}

function getDate() {
  const currentDate = new Date();
  const dateElements = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Australia/Sydney",
    hourCycle: "h23",
  })
    .format(currentDate)
    .split("/");

  const shrunkDate = dateElements.reverse().join("");

  return shrunkDate;
}

function getTime() {
  const currentDate = new Date();
  const dateElements = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "long",
    timeZone: "Australia/Sydney",
    hourCycle: "h23",
  })
    .format(currentDate)
    .split(":");

  const twentyFourHourTime = dateElements[0].concat(dateElements[1]);

  return twentyFourHourTime;
}

/* function isoToSydney(isoString) {
  function parseISOString(s) {
    const b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
  }

  const date = parseISOString(isoString);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "long",
    timeZone: "Australia/Sydney",
    hourCycle: "h23",
  })
    .format(date)
    .split(" ")[0];

  return formattedDate;
}*/

//getBusData().then((data) => console.log(data));
