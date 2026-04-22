import { useEffect, useState } from 'react';
import { thermalPrinterService } from '../services/thermalPrinterService';

const PrinterBridgeIndicator = () => {
  const [statusLabel, setStatusLabel] = useState('Bridge tidak aktif');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!thermalPrinterService.shouldUseBridge()) {
      return;
    }

    let active = true;

    const refresh = async () => {
      const status = await thermalPrinterService.getStatus();
      if (!active) {
        return;
      }

      const bridgeActive = status.bridgeAvailable !== false && status.bridgeRunning !== false;
      setConnected(bridgeActive && status.connected);
      setStatusLabel(
        bridgeActive
          ? status.connected
            ? 'Bridge aktif'
            : 'Bridge siap'
          : 'Bridge tidak aktif',
      );
    };

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!thermalPrinterService.shouldUseBridge()) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 sm:flex">
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-400'}`} />
      <span>{statusLabel}</span>
    </div>
  );
};

export default PrinterBridgeIndicator;
