import type { DeviceFacade, DeviceTransport } from "./types";
import { mockDevice } from "./mockDevice";

/**
 * Until real BLE/USB stacks land, all transports share the mock face + command log
 * so Settings → Device always "works" in software. Hardware clients can replace later.
 */
function softwareDevice(transport: DeviceTransport): DeviceFacade {
  // Proxy mock but advertise the selected transport name
  return new Proxy(mockDevice, {
    get(target, prop, receiver) {
      if (prop === "transport") return transport;
      return Reflect.get(target, prop, receiver);
    },
  }) as DeviceFacade;
}

export function getDevice(transport: DeviceTransport): DeviceFacade {
  switch (transport) {
    case "ble":
    case "usb":
    case "wifi":
    case "mock":
    default:
      return softwareDevice(transport === "wifi" ? "wifi" : transport);
  }
}

export function getActiveDevice(
  preferred: DeviceTransport = "mock"
): DeviceFacade {
  return getDevice(preferred);
}
