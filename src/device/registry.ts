import type { DeviceFacade, DeviceTransport } from "./types";
import { mockDevice } from "./mockDevice";
import { bleDevice } from "./bleClient";
import { usbDevice } from "./usbClient";
import { wifiDevice } from "./wifiClient";

/**
 * Return the client for the selected transport.
 * Mock always available; BLE/USB/Wi‑Fi use sim mode until real hardware plugins land.
 */
export function getDevice(transport: DeviceTransport): DeviceFacade {
  switch (transport) {
    case "ble":
      return bleDevice;
    case "usb":
      return usbDevice;
    case "wifi":
      return wifiDevice;
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

export { bleDevice, usbDevice, wifiDevice, mockDevice };
