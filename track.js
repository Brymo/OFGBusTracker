// DELETE THIS
const key =
  "";

// ping TransportNSW with a request to get busData
async function getBusData() {
  const date = getDate();
  const time = getTime();

  const requestURL = `https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=10115610&itdDate=${date}&itdTime=${time}&departureMonitorMacro=true&TfNSWDM=true&version=`;
  const busData = await fetch(requestURL, {
    method: "GET",
    accept: "application/json",
    headers: {
      Authorization: `apikey ${key}`,
    },
  }).then((response) => response.json());

  const trimmedBusData = busData.stopEvents.filter(stopEvent => stopEvent.isRealtimeControlled).map((stopEvent) => {
    const { departureTimeBaseTimetable, departureTimePlanned,departureTimeEstimated,transportation } =
      stopEvent;
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
  return "20240219";
}

function getTime() {
  return "1500";
}

getBusData()
  .then(data => console.log(data));
