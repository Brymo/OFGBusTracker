
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

  const t = timeUntilISO("2024-08-30T05:45:42Z");
  console.log(t);