package owlscores

import (
    "log"
    "sync/atomic"
    "time"
    "math"

    "omenweave-siem/common"
)

func StartOWLScoreBroadcast() {
    ticker := time.NewTicker(1 * time.Hour)
    for range ticker.C {
        broadcastOWLScore()
    }
}

func broadcastOWLScore() {
    if atomic.LoadInt32(&common.CurrentEntropyAvailable) == 1 {
        owlScoreBits := atomic.LoadInt64(&common.CurrentEntropyBits)
        owlScore := math.Float64frombits(uint64(owlScoreBits))
        log.Printf("Broadcasting OWL Score: %f", owlScore)
        response := map[string]interface{}{
            "current_score": owlScore,
        }

        common.BroadcastData(response)

        atomic.StoreInt32(&common.CurrentEntropyAvailable, 0)
    } else {
        log.Println("No new OWL score data to broadcast")
    }
}
