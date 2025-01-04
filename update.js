init();

let lastUpdate = new Date(0);

function init() {
  setCurrentTime();

  const checkbox = document.getElementById("show-analog-clock");
  const clockContainer = document.querySelector(".clock-container");
  checkbox.addEventListener("change", () => {
    clockContainer.style.display = checkbox.checked ? "flex" : "none";
  });

  const url = new URL(location.href);
  for (const [key, value] of url.searchParams) {
    switch (key) {
      case "progress":
        if (value !== null) document.getElementById("progress-input").value = value;
        break;
      case "target":
        if (value !== null) document.getElementById("target-input").value = value;
        break;
      case "start":
        if (value !== null && !isNaN(value)) setTime(new Date(Math.floor(Number(value))));
        break;
      case "update":
        if (value !== null && !isNaN(value)) {
          const elem = document.getElementById("update-interval");
          elem.value = Number(value);
          if (elem.value === "") elem.value = 1;
        }
        break;
      case "showAnalogClock":
        if (value === "false") checkbox.click();
    }
  }

  document.getElementById("set-current-time").addEventListener("click", setCurrentTime);
  document.getElementById("copy-url").addEventListener("click", copyURL);
}

/**
 * @param {Date} date
 */
function setTime(date) {
  const year = date.getFullYear();
  const monthString = zeroPad2(date.getMonth() + 1);
  const dateString = zeroPad2(date.getDate());
  const hoursString = zeroPad2(date.getHours());
  const minutesString = zeroPad2(date.getMinutes());
  const s = `${year}-${monthString}-${dateString}T${hoursString}:${minutesString}`;
  document.getElementById("start-time-input").value = s;
}
function setCurrentTime() {
  setTime(new Date());
}

/**
 * @param {number} n
 * @param {number} maxLength
 */
function zeroPad(n, maxLength) {
  return String(n).padStart(maxLength, "0");
}
/**
 * @param {number} n
 */
function zeroPad2(n) {
  return zeroPad(n, 2);
}

/**
 * @param {number} mill
 */
function formatMill(mill) {
  const t = Math.floor(mill / 1000);
  const hours = Math.floor(t / 3600);
  const minutes = Math.floor((t % 3600) / 60);
  const seconds = t % 60;
  return `${zeroPad2(hours)}:${zeroPad2(minutes)}:${zeroPad2(seconds)}`;
}

/**
 * @param {Element} clock
 * @param {Date} date
 */
function updateClock(clock, date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const hoursDegrees = (hours / 12) * 360 + (minutes / 60) * 30;
  const minutesDegrees = (minutes / 60) * 360;

  const hourHand = clock.querySelector(".hand.hour");
  const minuteHand = clock.querySelector(".hand.minute");

  hourHand.style.transform = `rotate(${hoursDegrees}deg)`;
  minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;

  const secondHand = clock.querySelector(".hand.second");
  if (secondHand !== null) {
    const seconds = date.getSeconds();
    const secondsDegrees = (seconds / 60) * 360;
    secondHand.style.transform = `rotate(${secondsDegrees}deg)`;
  }
}

function selectURL() {
  document.getElementById("url").select();
}

function copyURL() {
  selectURL();
  navigator.clipboard.writeText(document.getElementById("url").value);
}

function updateURL() {
  const url = new URL(location.href);
  const keys = Array.from(url.searchParams.keys());
  for (const key of keys) {
    url.searchParams.delete(key);
  }

  for (const param of ["progress", "target"]) {
    const elem = document.getElementById(`${param}-input`);
    if (elem.style.background === "none") url.searchParams.set(param, elem.value);
  }

  const startTimeInput = document.getElementById("start-time-input");
  if (startTimeInput.style.background === "none")
    url.searchParams.set("start", new Date(startTimeInput.value).getTime());

  url.searchParams.set("update", document.getElementById("update-interval").value);

  if (!document.getElementById("show-analog-clock").checked) url.searchParams.set("showAnalogClock", "false");

  document.getElementById("url").value = url;
}

function update() {
  for (const id of ["progress-input", "target-input"]) {
    const elem = document.getElementById(id);
    elem.style.background = elem.value === "" || Number(elem.value) < 0 ? "red" : "none";
  }

  const now = new Date();

  const startTimeInput = document.getElementById("start-time-input");
  const startTimeInputValue = startTimeInput.value;
  startTimeInput.style.background =
    startTimeInputValue === "" || new Date(startTimeInputValue) >= now ? "red" : "none";

  updateURL();

  const updateInterval = Number(document.getElementById("update-interval").value);
  if (updateInterval <= 1) {
    document.getElementById("now-time").innerText = now.toLocaleString();
    updateClock(document.querySelector(".clock.clock-now"), now);
  }
  if ((now - lastUpdate) / 1000 >= updateInterval) {
    lastUpdate = now;

    document.getElementById("progress").innerText = "";
    document.getElementById("start-time").innerText = "";
    document.getElementById("elapsed-time").innerText = "";
    document.getElementById("estimated-total-time").innerText = "";
    document.getElementById("estimated-end-time").innerText = "";

    document.getElementById("now-time").innerText = now.toLocaleString();
    updateClock(document.querySelector(".clock.clock-now"), now);

    for (const id of ["progress-input", "target-input"]) {
      const elem = document.getElementById(id);
      if (elem.style.background !== "none") return;
    }

    const progress = Number(document.getElementById("progress-input").value);
    const target = Number(document.getElementById("target-input").value);
    document.getElementById("progress").innerText = `${progress}/${target}`;

    if (startTimeInput.style.background !== "none") return;

    const startTime = new Date(startTimeInputValue);
    document.getElementById("start-time").innerText = startTime.toLocaleString();

    if (target === 0) {
      document.getElementById("estimated-total-time").innerText = formatMill(0);
      document.getElementById("estimated-end-time").innerText = startTime.toLocaleString();
      updateClock(document.querySelector(".clock.clock-estimated"), startTime);
    } else {
      const elapsedMill = now - startTime;
      const totalTimeMill = (elapsedMill / progress) * target;
      if (progress === 0) {
        document.getElementById("elapsed-time").innerText = formatMill(elapsedMill);
        document.getElementById("estimated-total-time").innerText = "?";
        document.getElementById("estimated-end-time").innerText = "?";
        updateClock(document.querySelector(".clock.clock-estimated"), new Date("2000-01-01T00:00:00"));
      } else {
        document.getElementById("elapsed-time").innerText = `${formatMill(elapsedMill)} (1あたり ${formatMill(
          elapsedMill / progress
        )})`;
        document.getElementById("estimated-total-time").innerText = formatMill(totalTimeMill);
        const endTime = new Date(startTime.getTime() + totalTimeMill);
        document.getElementById("estimated-end-time").innerText = endTime.toLocaleString();
        updateClock(document.querySelector(".clock.clock-estimated"), endTime);
      }
    }
  }
}

setInterval(update, 15);
