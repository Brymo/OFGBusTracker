const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const port = 3000;
const ofgIDa = "2100156";
const ofgIDb = "10115610";
const cbdID = "10111010";

const usedIDs = [cbdID];

app.get("/:page", cors(), (req, res) => {
  console.log("request from " + req.url);
  const results = usedIDs.map((usedID) => getBusData(usedID, req.params.page));
  Promise.all(results).then((results) => {
    res.send(results.flat());
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const key =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI4M3NERnl6WVZ4cnR0bDVOUWNUd0VCRzFtaGpuYm9hdmVPTTZ1N1duOEU4IiwiaWF0IjoxNzA5NTI0MTUyfQ.AJeLDcguwvZjs7VmmwG0cTKhPWI3HuOvlLA4fFTSnnw";

const numResults = 3;

// ping TransportNSW with a request to get busData
async function getBusData(usedID, page) {
  console.log(page);
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

  const sortedBusData = trimmedBusData.sort(function (a, b) {
    return isFirstTimeEarlier(
      a.departureTimeEstimated,
      b.departureTimeEstimated
    );
  });

  const dataWithStatusAdded = sortedBusData.map((singleBusInfo) => {
    const clone = { ...singleBusInfo };
    clone.status = isBusEarly(singleBusInfo);
    return clone;
  });

  const timeFormattedData = dataWithStatusAdded.map((singleBusInfo) =>
    formatOnlyIsoTimes(singleBusInfo)
  );

  console.log(timeFormattedData);

  return timeFormattedData;
}

function isBusEarly(busData) {
  return isFirstTimeEarlier(
    busData.departureTimeEstimated,
    busData.departureTimePlanned
  );
}

function isFirstTimeEarlier(first, second) {
  let status = 0;
  if (first > second) status = -1;
  if (first < second) status = 1;
  return status;
}

function formatOnlyIsoTimes(busData) {
  function timeUntilISO(ISO) {
    const now = Math.floor(new Date().getTime() / 1000); //account for milliseconds
    const time = Math.floor(new Date(ISO).getTime() / 1000);
    const secondDifference = time - now;

    const hours = Math.floor(secondDifference / 3600);
    const minutes = Math.floor(secondDifference / 60) - hours * 60;

    const timeUntilDeparture = hours > 0 ? `${hours} hr ${minutes} mins` : `${minutes} mins`;

    return timeUntilDeparture == "O mins" ? "Now" : timeUntilDeparture;
  }

  const formattedData = Object.keys(busData).reduce((acc, key) => {
    const clone = { ...acc };
    clone[key] = isISOTime(busData[key])
      ? timeUntilISO(busData[key])
      : busData[key];
    return clone;
  }, {});

  return formattedData;
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

function isISOTime(value) {
  return (
    typeof value == "string" &&
    value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g)
  );
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
