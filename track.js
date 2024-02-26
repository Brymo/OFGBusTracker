setTimeout(run,1000);

function run() {
  console.log("ping");
  updateBoard();
  setInterval(updateBoard, 10 * 1000);
}

async function updateBoard() {
  const newBusResults = await pingBusServer();
  console.log(newBusResults);
  wipeBoard();

  const body = document.body;

  newBusResults.forEach(busDetail => {
    body.appendChild(createBusDetailRow(busDetail));
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
  busTimeContainer.innerText = departureTimeEstimated;

  container.appendChild(busNameContainer);
  container.appendChild(busTimeContainer);

  return container;
}

function wipeBoard(){
  const body = document.body;
  body.innerHTML = ""
}
