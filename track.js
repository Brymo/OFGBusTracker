run();
setInterval(run, 10*1000);

async function run() {
  await fetch("http://localhost:3000", {
    method: "GET",
    accept: "application/json",
    mode: "no-cors",
  })
    .then((response) => console.log(response))
}
