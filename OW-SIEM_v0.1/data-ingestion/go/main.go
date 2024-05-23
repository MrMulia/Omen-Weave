package main

import (
    "omenweave-siem/common"
    "omenweave-siem/server"
    "omenweave-siem/owlscores"
)

func main() {
    common.InitLocalIP()
    go owlscores.StartOWLScoreBroadcast()
    server.StartServer()
}
