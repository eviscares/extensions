import { closeMainWindow, getPreferenceValues, showHUD } from "@raycast/api";
import { execAirPodsMenu } from "./airpods-menu";
import { Prefs } from "./type";

export default async function main() {
  const prefs = getPreferenceValues<Prefs>();
  await closeMainWindow();
  const res = await execAirPodsMenu(prefs, "");
  if (prefs.showHudCA && res) showHUD(res);
}
