'use client'

import { ManualTokenURIFetch } from './ManualTokenURIFetch'

export default function BlockchainInteractionDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Blockchain Interaction Demo
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Educational examples of raw blockchain interaction
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
                Raw eth_call Demonstration
              </h2>
              <p className="text-gray-300 mb-4">
                This component shows how to manually call contract functions without any high-level wrappers.
                It demonstrates:
              </p>
              <ul className="text-gray-400 space-y-2 mb-6">
                <li>• Manual ABI encoding/decoding</li>
                <li>• Direct eth_call to blockchain</li>
                <li>• No ethers.Contract wrapper</li>
                <li>• Real-time data from Shape Sepolia</li>
                <li>• Base64 JSON parsing</li>
              </ul>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <ManualTokenURIFetch />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-300 mb-4">
                Why This Matters
              </h2>
              <div className="space-y-4 text-gray-300">
                <div className="bg-slate-900/30 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">🔍 Debugging</h3>
                  <p className="text-sm">
                    When wagmi or ethers wrappers fail, this shows the raw blockchain interaction
                    to isolate issues from library abstractions.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">📚 Learning</h3>
                  <p className="text-sm">
                    Understanding raw eth_call helps developers grasp blockchain fundamentals
                    and build more robust applications.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">⚡ Performance</h3>
                  <p className="text-sm">
                    Direct calls can be more efficient than library wrappers in some scenarios,
                    especially for simple read operations.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">🚫 Caching Bypass</h3>
                  <p className="text-sm">
                    Raw calls bypass any intermediate caching layers, ensuring fresh blockchain data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-yellow-300 mb-4">
              Technical Implementation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Function Call Flow:</h3>
                <div className="bg-slate-900/50 p-4 rounded font-mono text-sm text-gray-300">
                  <div>1. Get function selector: 0xc87b56dd</div>
                  <div>2. Pad tokenId to 32 bytes</div>
                  <div>3. Concatenate: selector + padded_tokenId</div>
                  <div>4. eth_call to contract</div>
                  <div>5. Decode hex result</div>
                  <div>6. Parse base64 JSON</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Utility Functions Used:</h3>
                <div className="bg-slate-900/50 p-4 rounded font-mono text-sm text-gray-300 space-y-1">
                  <div><span className="text-cyan-300">manualEthCall()</span> - Raw blockchain call</div>
                  <div><span className="text-cyan-300">decodeContractResult()</span> - ABI decoding</div>
                  <div><span className="text-cyan-300">parseTokenURIData()</span> - JSON parsing</div>
                  <div><span className="text-cyan-300">handleContractError()</span> - Error handling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
