'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DepositViewProps {
  depositAddress: string;
}

export default function DepositView({ depositAddress }: DepositViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit USDT</h2>
        <p className="text-gray-600">Send ERC20 USDT to the address below</p>
      </div>

      <div className="space-y-6">
        {/* Network Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">Network</p>
          <p className="text-sm text-blue-700">ERC20 USDT (Ethereum)</p>
        </div>

        {/* Deposit Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={depositAddress}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              value={depositAddress}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Only send ERC20 USDT to this address</li>
            <li>Do not send other cryptocurrencies or tokens</li>
            <li>Double-check the address before sending</li>
            <li>Minimum deposit: $35</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

