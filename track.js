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

  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get("page") || 0;

  return await fetch(`http://localhost:3000/${page}`, {
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

  const busStatusDotContainer = document.createElement("div");
  busStatusDotContainer.className = "statusDotContainer";
  const busStatusDot = document.createElement("div");
  busStatusDot.className = "statusDot";
  busStatusDot.style.backgroundColor = busDetail.status == -1 ? "red" : "green";
  busStatusDotContainer.appendChild(busStatusDot);

  
  const busContainer = document.createElement("div");
  busContainer.className = "busContainer";
  busContainer.appendChild(busNameContainer);
  busContainer.appendChild(busStatusDotContainer);

  const busTimeContainer = document.createElement("div");
  busTimeContainer.innerText = departureTimeEstimated;

  container.appendChild(busContainer);
  container.appendChild(busTimeContainer);

  return container;
}


function wipeBoard(){
  const allDetails = document.getElementById("allBusDetails");
  allDetails.innerHTML = ""
}
