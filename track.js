setTimeout(run,1000);

function run() {
  updateBoard();
  updateTime();
  setInterval(updateBoard, 10 * 1000);
  setInterval(updateTime, 1 * 1000);
}

function updateTime(){
  const timeContainer = document.getElementById("time");
  const currentTime = new Date().toLocaleString('en-US',{hour: 'numeric', minute: 'numeric', hour12: true});

  timeContainer.innerText = `Time:  ${currentTime}`;
}

async function updateBoard() {
  const newBusResults = await pingBusServer();
  wipeBoard();

  const allDetails = document.getElementById("allBusDetails");

  newBusResults.forEach(busDetail => {
    allDetails.appendChild(createBusDetailRow(busDetail));
  });
}

async function pingBusServer() {
  return await fetch("http://localhost:3000", {
    method: "GET",
    accept: "application/json",
    mode: "cors",
  }).then(response => response.json());
}

function createBusDetailRow(busDetail){
  const {busName, departureTimeEstimated} = busDetail;
  const container = document.createElement("div");
  container.className = "busDetails";

  const busNameContainer = document.createElement("div");
  busNameContainer.innerText = busName;
  
  const busTimeContainer = document.createElement("div");
  busTimeContainer.innerText = timeUntilISO(departureTimeEstimated);

  container.appendChild(busNameContainer);
  container.appendChild(busTimeContainer);

  return container;
}

function timeUntilISO(ISO){
  const now = Math.floor(new Date().getTime()/1000); //account for milliseconds
  const time = Math.floor(new Date(ISO).getTime()/1000);
  const secondDifference = time - now;

  const hours = Math.floor(secondDifference / 3600);
  const minutes = Math.floor(secondDifference/60) - hours*60;

  return hours > 0 ? `${hours} hr ${minutes} mins` : `${minutes} mins`;

}

function wipeBoard(){
  const allDetails = document.getElementById("allBusDetails");
  allDetails.innerHTML = ""
}
