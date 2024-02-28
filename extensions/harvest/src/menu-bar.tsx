import React from "react";
import { Cache, LaunchType, MenuBarExtra, getPreferenceValues, launchCommand, open } from "@raycast/api";
import { formatHours, useCompany, useMyTimeEntries } from "./services/harvest";
import { HarvestTimeEntry } from "./services/responseTypes";
import { writeFileSync, rmSync, existsSync, mkdirSync } from "fs";

const cache = new Cache();

export function getCurrentTimerFromCache() {
  const running = cache.get("running");
  if (!running) return;
  return JSON.parse(running) as HarvestTimeEntry;
}

export default function MenuBar() {
  const { data, isLoading } = useMyTimeEntries();
  const [cacheLoading, setCacheLoading] = React.useState(true);
  const { data: company, isLoading: companyLoading } = useCompany();

  const runningTimer = getCurrentTimerFromCache();
  const {
    callbackURLStart,
    callbackURLStop,
    showTimerInMenuBar = true,
  } = getPreferenceValues<{
    callbackURLStart?: string;
    callbackURLStop?: string;
    showTimerInMenuBar?: boolean;
    statusFolder?: string;
  }>();

  React.useEffect(() => {
    if (data && !isLoading) {
      const found = data.find((o) => o.is_running);
      if (runningTimer?.id !== found?.id) {
        if (found && callbackURLStart) open(callbackURLStart);
        if (!found && callbackURLStop) open(callbackURLStop);
      }
      if (found) {
        cache.set("running", JSON.stringify(found));
        setStatusFile(found);
      } else {
        cache.remove("running");
        setStatusFile(null);
      }
      setCacheLoading(false);
    }
  }, [data, isLoading]);

  if (!runningTimer)
    return (
      <MenuBarExtra
        icon={{ source: runningTimer ? "../assets/harvest-logo-icon.png" : "../assets/harvest-logo-icon-gray.png" }}
        isLoading={isLoading || cacheLoading}
      >
        <MenuBarExtra.Item title="No Timer Running" />
        <MenuBarExtra.Item
          title="View Timesheet"
          onAction={() => {
            launchCommand({ extensionName: "harvest", name: "listTimeEntries", type: LaunchType.UserInitiated });
          }}
        />
      </MenuBarExtra>
    );

  return (
    <MenuBarExtra
      icon={{ source: "../assets/harvest-logo-icon.png" }}
      title={showTimerInMenuBar ? formatHours(runningTimer.hours.toString(), company) : undefined}
      isLoading={isLoading || cacheLoading || companyLoading}
    >
      <MenuBarExtra.Item title={`${runningTimer.project.name} - ${runningTimer.task.name}`} />
      {runningTimer.notes && runningTimer.notes.length > 0 && <MenuBarExtra.Item title={`${runningTimer.notes}`} />}

      <MenuBarExtra.Item
        title="View Timesheet"
        onAction={() => {
          launchCommand({ extensionName: "harvest", name: "listTimeEntries", type: LaunchType.UserInitiated });
        }}
      />

      {/* <MenuBarExtra.Item
        title="Stop Timer"
        onAction={async () => {
          setCacheLoading(true);
          console.log("stopping timer...");
          await stopTimer(runningTimer);
          revalidate();
          setCacheLoading(false);
        }}
      /> */}
    </MenuBarExtra>
  );
}

function setStatusFile(timeEntry: HarvestTimeEntry | null) {
  const { statusFolder } = getPreferenceValues<{ statusFolder?: string }>();
  if (!statusFolder) return;
  if (!existsSync(statusFolder)) mkdirSync(statusFolder);
  const statusFile = `${statusFolder}/currentTimer.json`;

  if (timeEntry) {
    writeFileSync(statusFile, JSON.stringify(timeEntry));
  } else {
    if (existsSync(statusFile)) rmSync(statusFile);
  }
}
