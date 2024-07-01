package entropy

import (
    "log"
    "sync/atomic"
    "math"

    "omenweave-siem/common"
)

func broadcastEntropy() {
    if atomic.LoadInt32(&common.CurrentEntropyAvailable) == 1 {
        entropyBits := atomic.LoadInt64(&common.CurrentEntropyBits)
        entropy := math.Float64frombits(uint64(entropyBits))
        log.Printf("Broadcasting Entropy: %f", entropy)
        response := map[string]interface{}{
            "entropy": entropy,
        }

        common.BroadcastData(response)
    } else {
        log.Println("No new entropy data to broadcast")
    }
}
