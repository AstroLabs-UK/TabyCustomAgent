import type { DeviceFacade, DeviceTransport } from "./types";
import { mockDevice } from "./mockDevice";
import { bleDevice } from "./bleClient";
import { usbDevice } from "./usbClient";

export function getDevice(transport: DeviceTransport): DeviceFacade {
  switch (transport) {
    case "ble":
      return bleDevice;
    case "usb":
      return usbDevice;
    case "wifi":
      // Wi-Fi later — fall back to mock for software stages
      return mockDevice;
    case "mock":
    default:
      return mockDevice;
  }
}

export function getActiveDevice(
  preferred: DeviceTransport = "mock"
): DeviceFacade {
  return getDevice(preferred);
}
