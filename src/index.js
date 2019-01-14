import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import "./styles.css";

function useFetch(url, params, location, defaultData) {
  const [data, updateData] = useState(defaultData);

  useEffect(
    async () => {
      const resp = await fetch(url, params);
      const json = await resp.json();
      console.log("dsad", json);
      updateData(json);
    },
    [url, params.body, params.minute]
  );
  return data;
}

function useFetchHSLStop(location, minute) {
  const query =
    "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";
  const params = {
    minute,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        '{ stops(ids: "' +
        location +
        '") { name gtfsId code stoptimesWithoutPatterns(omitNonPickups: true) { trip { route { shortName } } serviceDay scheduledDeparture realtimeDeparture realtime realtimeState headsign arrivalDelay } } }'
    })
  };
  return useFetch(query, params, {});
}

const stops = ["HSL:4930205", "HSL:4930206"];
const startTime = Date.now();
let updateInterval = null;
const formatTime = date => {
  return (
    date.getHours() +
    ":" +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
  );
};
const formatTimeOffset = time => {
  var minutes = Math.floor(time / 60000);
  var seconds = ((time % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
};

function App() {
  const [location, setLocation] = useState(stops[0]);
  const [time, setTime] = useState(startTime);
  if (!updateInterval) {
    updateInterval = setInterval(() => setTime(Date.now()), 1000);
  }
  const now = new Date(time);
  const minute = now.getMinutes(); // used to make refresh every minute
  const result = useFetchHSLStop(location, minute);

  return (
    <div>
      <select type="input" onChange={evt => setLocation(evt.target.value)}>
        {stops.map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      {result
        ? result.data.stops.map(s => (
            <div>
              <div class="stop">
                <div>
                  Pysäkki:{s.name} / {s.gtfsId} / {s.code}
                </div>
                <div class="clock">{formatTime(now)}</div>
              </div>
              {s.stoptimesWithoutPatterns.map(bus => {
                const serviceDay = new Date(bus.serviceDay * 1000);
                const scheduleTime = new Date(
                  bus.serviceDay * 1000 + bus.realtimeDeparture * 1000
                );
                const arrival = scheduleTime.getTime() - now.getTime();
                return (
                  <div class={"bus " + bus.realtimeState}>
                    <div class="shortName">{bus.trip.route.shortName}</div>
                    <div class="headsign">{bus.headsign}</div>
                    <div>{formatTime(scheduleTime)}</div>
                    <div>{formatTimeOffset(arrival)}</div>
                  </div>
                );
              })}
            </div>
          ))
        : ""}
      <div class="debug">
        Debug:
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
