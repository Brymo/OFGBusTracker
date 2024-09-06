const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const resultsPerPage = 3;
const numPages = 3;

const port = 3000;
const ofgIDa = "2100156";
const ofgIDb = "10115610";
const cbdID = "10111010";

let lastResults = null;
const passedBusses = makeBusQueue();

const usedIDs = [ofgIDa,ofgIDb];

app.get("/:page", cors(), (req, res) => {
  console.log("request from " + req.url);
  const page = req.params.page;
  const results =
    page == 3
      ? passedBusses.queue
      : usedIDs.map((usedID) => getBusData(usedID, page));
  Promise.all(results).then((results) => {
    res.send(results.flat());
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const key =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI4M3NERnl6WVZ4cnR0bDVOUWNUd0VCRzFtaGpuYm9hdmVPTTZ1N1duOEU4IiwiaWF0IjoxNzA5NTI0MTUyfQ.AJeLDcguwvZjs7VmmwG0cTKhPWI3HuOvlLA4fFTSnnw";

// ping TransportNSW with a request to get busData
async function getBusData(usedID, page) {
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
      (stopEvent, index) =>
        stopEvent.isRealtimeControlled && index < resultsPerPage * numPages
    )
    .map((stopEvent) => {
      const {
        departureTimeBaseTimetable,
        departureTimePlanned,
        departureTimeEstimated,
        transportation,
        properties,
      } = stopEvent;

      return {
        departureTimePlanned,
        departureTimeBaseTimetable,
        departureTimeEstimated,
        busName: transportation.disassembledName,
        id: properties.RealtimeTripId,
      };
    });

  console.log(trimmedBusData);

  const sortedBusData = trimmedBusData.sort(function (a, b) {
    return !isFirstTimeEarlier(
      a.departureTimeEstimated,
      b.departureTimeEstimated
    );
  });

  const dataWithStatusAdded = sortedBusData.map((singleBusInfo) => {
    const clone = { ...singleBusInfo };
    clone.status = isBusEarly(singleBusInfo);
    return clone;
  });

  console.log(dataWithStatusAdded);
  const timeFormattedData = dataWithStatusAdded.map((singleBusInfo) =>
    formatOnlyIsoTimes(singleBusInfo)
  );

  if (lastResults != null) {
    passedBusses.add(diff(lastResults, timeFormattedData));
  }
  lastResults = timeFormattedData;

  console.log(passedBusses);

  const startPage = page * resultsPerPage;
  const endPage = startPage + resultsPerPage;
  const dataTrimmedToPage =
    page == 3
      ? passedBusses.queue
      : timeFormattedData.slice(startPage, endPage);

  console.log(dataTrimmedToPage);

  return dataTrimmedToPage;
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
    console.log({secondDifference})
    const hours = Math.floor(secondDifference / 3600);
    const minutes = Math.floor(secondDifference / 60) - hours * 60;

    const timeUntilDeparture =
      hours > 0 ? `${hours} hr ${minutes} mins` : `${minutes} mins`;

    if (secondDifference < 0) return "Departed";
    return timeUntilDeparture == "0 mins" ? "Now" : timeUntilDeparture;
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

function makeBusQueue(queue = [], size = 3) {
  return {
    queue,
    size,
    add: function add(value) {
      const pushOntoQueue = (v) => {
        this.queue = [v, ...this.queue];
        if (this.queue.length > this.size) {
          this.queue.pop();
        }
      };

      if (Array.isArray(value)) {
        value.forEach((v) => {
          pushOntoQueue(v);
        });
      } else {
        pushOntoQueue(value);
      }
    },
    print: function print() {
      console.log(this.queue);
    },
  };
}

function diff(oldList, newList) {
  return newList.reduce((acc, newBus) => {
    return acc.filter((oldBus) => oldBus.id != newBus.id);
  }, oldList);
}
